import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';
import {Tooltip} from 'react-tooltip';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import {defaultProjectId} from '../../reducers/project-state';
import styles from './project-input.css';
import {setProjectId} from '../../lib/utils/navigation';

const PROJECT_BASE = 'https://scratch.mit.edu/projects/';

const messages = defineMessages({
    tooltip: {
        defaultMessage: 'Copy and paste a Scratch project link here!',
        description: 'Project ID input tooltip',
        id: 'tw.input.tooltip'
    }
});

class ProjectInput extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleKeyDown',
            'handleChange',
            'handleBlur',
            'handleFocus',
            'inputRef',
            'setTooltipOpen'
        ]);
        this.state = {
            projectId: this.props.projectId,
            tooltipOpen: false
        };
        this.tooltipId = 'tw-project-input-tooltip';
    }
    componentDidUpdate (prevProps) {
        if (this.props.projectId !== prevProps.projectId) {
            if (this.props.projectId === defaultProjectId) {
                this.input.focus();
                this.input.selectionStart = this.input.value.length;
            } else {
                this.input.blur();
            }
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                projectId: this.props.projectId
            });
        }
    }
    extractProjectId (text) {
        const numberMatch = text.match(/\d+/);
        return numberMatch ? numberMatch[0] : null;
    }
    readProjectId (e) {
        const id = this.extractProjectId(e.target.value);
        return id || defaultProjectId;
    }
    handleKeyDown (e) {
        if (e.key === 'Enter' && this.state.projectId) {
            this.input.blur();
        }
    }
    handleChange (e) {
        this.setState({
            projectId: this.readProjectId(e) || defaultProjectId
        });
    }
    handleBlur () {
        if (this.state.projectId && this.state.projectId !== this.props.projectId) {
            this.props.setProjectId(this.state.projectId);
        }
        this.setTooltipOpen(false);
    }
    handleFocus (e) {
        if (this.extractProjectId(e.target.value)) {
            e.target.select();
        }
        this.setTooltipOpen(true);
    }
    inputRef (el) {
        this.input = el;
    }
    setTooltipOpen (tooltipOpen) {
        this.setState({tooltipOpen});
    }
    render () {
        const projectId = this.state.projectId === defaultProjectId ? '' : this.state.projectId || '';
        return (
            <div
                data-tooltip-content={this.props.intl.formatMessage(messages.tooltip)}
                data-tooltip-id={this.tooltipId}
            >
                <Tooltip
                    className={styles.tooltip}
                    id={this.tooltipId}
                    isOpen={this.state.tooltipOpen}
                    setIsOpen={this.setTooltipOpen}
                />
                <input
                    ref={this.inputRef}
                    spellCheck="false"
                    type="text"
                    value={`${PROJECT_BASE}${projectId}`}
                    className={styles.input}
                    onKeyDown={this.handleKeyDown}
                    onChange={this.handleChange}
                    onBlur={this.handleBlur}
                    onFocus={this.handleFocus}
                />
            </div>
        );
    }
}

ProjectInput.propTypes = {
    intl: intlShape,
    projectId: PropTypes.string,
    setProjectId: PropTypes.func
};

const mapStateToProps = state => ({
    projectId: state.scratchGui.projectState.projectId
});

const mapDispatchToProps = dispatch => ({
    setProjectId: projectId => setProjectId(dispatch, projectId)
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(ProjectInput));
