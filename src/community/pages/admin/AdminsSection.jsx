import React from 'react';
import {useCommunityIntl as useCommunityText} from '../../i18n.jsx';
import {ShieldCheck} from 'lucide-react';
import Avatar from '../../components/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import styles from '../Admin.module.css';

// The admin list, with a field to add another admin.
const AdminsSection = ({admins, newAdmin, setNewAdmin, addAdmin, removeAdmin}) => {
    const {text: communityText} = useCommunityText();
    return (
        <section className={styles.card}>
            <SectionHeading icon={ShieldCheck} title={communityText('Admins')} />
            <div className={styles.addAdmin}>
                <input
                    className={styles.input}
                    placeholder={communityText('Username')}
                    value={newAdmin}
                    onChange={e => setNewAdmin(e.target.value)}
                />
                <Button onClick={addAdmin}>{communityText('Add admin')}</Button>
            </div>
            <div className={styles.list}>
                {admins.map(admin => (
                    <div
                        key={admin.username}
                        className={styles.row}
                    >
                        <Avatar
                            username={admin.username}
                            size={28}
                        />
                        <div className={styles.rowInfo}>
                            <span className={styles.rowTitle}>{`@${admin.username}`}</span>
                            <span className={styles.rowMeta}>
                                {admin.super ? communityText('Super admin') : communityText('Admin')}
                            </span>
                        </div>
                        <div className={styles.rowActions}>
                            {admin.super ? null : (
                                <Button onClick={() => removeAdmin(admin.username)}>{communityText('Remove')}</Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AdminsSection;
