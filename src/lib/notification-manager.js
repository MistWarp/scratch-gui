class NotificationManager {
    constructor () {
        this.listeners = [];
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 4000;
        this.nextId = 0;
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
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }

        return id;
    }

    dismiss (id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.notifyListeners();
    }

    dismissAll () {
        this.notifications = [];
        this.notifyListeners();
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
