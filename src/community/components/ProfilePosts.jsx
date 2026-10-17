import {useCommunityIntl as useCommunityText} from '../i18n.jsx';
import PropTypes from 'prop-types';
import React, {useEffect, useMemo} from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import {CellMeasurer, CellMeasurerCache} from 'react-virtualized/dist/commonjs/CellMeasurer';
import List from 'react-virtualized/dist/commonjs/List';
import WindowScroller from 'react-virtualized/dist/commonjs/WindowScroller';
import {MessageSquare} from 'lucide-react';
import EmptyState from './ui/EmptyState.jsx';
import PostComposer from './PostComposer.jsx';
import SocialPost from './SocialPost.jsx';
import {postUrl} from '../following-feed.js';
import styles from './ProfilePosts.module.css';

export const postMetricCount = value => (Array.isArray(value) ? value.length :
    (Number.isFinite(value) ? Math.max(0, value) : 0));
export const postTimestamp = value => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    return numeric > 10000000000 ? numeric : numeric * 1000;
};
export const sortProfilePosts = posts => [...posts].sort((left, right) => {
    if (Boolean(left.pinned) !== Boolean(right.pinned)) return left.pinned ? -1 : 1;
    return (postTimestamp(right.timestamp) || 0) - (postTimestamp(left.timestamp) || 0);
});
export const pouncePostUrl = postUrl;

const VIRTUALIZATION_THRESHOLD = 20;

const VirtualPostList = ({posts, renderPost}) => {
    const cache = useMemo(() => new CellMeasurerCache({fixedWidth: true, defaultHeight: 150}), []);
    useEffect(() => {
        cache.clearAll();
    }, [cache, posts]);
    return (
        <WindowScroller>
            {({height, isScrolling, onChildScroll, scrollTop}) => (
                <AutoSizer disableHeight>
                    {({width}) => (
                        <List
                            autoHeight
                            deferredMeasurementCache={cache}
                            height={height}
                            isScrolling={isScrolling}
                            onScroll={onChildScroll}
                            rowCount={posts.length}
                            rowHeight={cache.rowHeight}
                            rowRenderer={({index, key, parent, style}) => (
                                <CellMeasurer
                                    cache={cache}
                                    columnIndex={0}
                                    key={key}
                                    parent={parent}
                                    rowIndex={index}
                                >
                                    {({measure, registerChild}) => (
                                        <div ref={registerChild} style={style} className={styles.virtualRow}>
                                            {renderPost(posts[index], measure)}
                                        </div>
                                    )}
                                </CellMeasurer>
                            )}
                            scrollTop={scrollTop}
                            width={width}
                        />
                    )}
                </AutoSizer>
            )}
        </WindowScroller>
    );
};

VirtualPostList.propTypes = {
    posts: PropTypes.arrayOf(PropTypes.object).isRequired,
    renderPost: PropTypes.func.isRequired
};

const ProfilePosts = ({posts, username, viewer, editable, onChange}) => {
    const {text: communityText} = useCommunityText();
    const sorted = useMemo(() => sortProfilePosts(posts).map(post => (
        post.user ? post : {...post, user: username}
    )), [posts, username]);
    const replacePost = next => onChange(posts.map(item => (item.id === next.id ? {...item, ...next} : item)));
    const removePost = id => onChange(posts.filter(item => item.id !== id));
    const renderPost = (post, measure) => (
        <SocialPost
            key={post.id}
            initialPost={post}
            onProfile
            onChange={replacePost}
            onDelete={removePost}
            onLayoutChange={measure}
        />
    );
    return (
        <div className={styles.posts}>
            {editable && viewer ? (
                <PostComposer
                    user={viewer}
                    onPosted={post => onChange([post, ...posts])}
                />
            ) : null}
            {!sorted.length ? (
                <EmptyState compact icon={MessageSquare} title={communityText('No posts yet')}>
                    {editable ?
                        communityText('You have not posted anything yet.') :
                        communityText('{value1} has not posted anything yet.', {value1: username})}
                </EmptyState>
            ) : null}
            <div className={styles.list}>
                {sorted.length > VIRTUALIZATION_THRESHOLD ? (
                    <VirtualPostList posts={sorted} renderPost={renderPost} />
                ) : sorted.map(post => renderPost(post))}
            </div>
        </div>
    );
};

ProfilePosts.propTypes = {
    posts: PropTypes.arrayOf(PropTypes.object).isRequired,
    username: PropTypes.string.isRequired,
    viewer: PropTypes.object,
    editable: PropTypes.bool,
    onChange: PropTypes.func.isRequired
};

export default ProfilePosts;
