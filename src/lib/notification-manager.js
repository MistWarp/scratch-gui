class NotificationManager {
    constructor () {
        this.listeners = [];
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 4000;
        this.nextId = 0;
        this.dismissTimeouts = new Map();
    }

    subscribe (listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners () {
        this.listeners.forEach(listener => listener([...this.notifications]));
    }

    show (message, type = 'info', duration = this.defaultDuration, options = {}) {
        const id = `notification-${++this.nextId}`;

        this.notifications.push({
            id,
            message,
            type,
            duration,
            options
        });

        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
        }

        this.notifyListeners();

        if (duration > 0) {
            const timeoutId = setTimeout(() => {
                this.dismiss(id);
            }, duration);
            this.dismissTimeouts.set(id, timeoutId);
        }

        return id;
    }

    dismiss (id) {
        if (this.dismissTimeouts.has(id)) {
            clearTimeout(this.dismissTimeouts.get(id));
            this.dismissTimeouts.delete(id);
        }
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.notifyListeners();
    }

    dismissAll () {
        this.dismissTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.dismissTimeouts.clear();
        this.notifications = [];
        this.notifyListeners();
    }

    cleanup () {
        this.dismissAll();
        this.listeners = [];
    }

    info (message, duration, options) {
        return this.show(message, 'info', duration, options);
    }

    success (message, duration, options) {
        return this.show(message, 'success', duration, options);
    }

    warning (message, duration, options) {
        return this.show(message, 'warning', duration, options);
    }

    error (message, duration, options) {
        return this.show(message, 'error', duration, options);
    }
}

const notificationManager = new NotificationManager();

if (typeof window !== 'undefined') {
    window.NotificationSystem = notificationManager;
}

export default notificationManager;
