/* eslint-disable react/jsx-no-bind, max-len, indent, react/jsx-indent, react/jsx-indent-props, react/jsx-closing-bracket-location, no-negated-condition */
import React from 'react';
import PropTypes from 'prop-types';
import {Section, ImageInput, ColorPicker, CustomExtensions, LearnMore} from './controls.jsx';

// Complete export options, rendered by the editor's React window.
const PackagerOptions = ({model}) => {
    const {options: $options, defaults: defaultOptions, translate: $_, cloudVariables,
        projectData, hasSettingsStoredInProject, otherEnvironmentsInitiallyOpen,
        advancedOptionsInitiallyOpen, editOptions, resetOptions, automaticallyCenterCursor} = model;
    const $icon = $options.app.icon;
    const $loadingScreenImage = $options.loadingScreen.image;
    const $customCursorIcon = $options.cursor.custom;
    const ALMOST_INFINITY = 9999999999;
    return (<>

        <Section
            tab={'Runtime'}
            reset={() => {
                resetOptions([
                    'turbo',
                    'framerate',
                    'interpolation',
                    'highQualityPen',
                    'maxClones',
                    'fencing',
                    'miscLimits',
                    'stageWidth',
                    'stageHeight',
                    'resizeMode',
                    'username'
                ]);
            }}
        >
            <div >
                <h2 >{$_('options.runtimeOptions')}</h2>
                {hasSettingsStoredInProject ? <><div className={'group'}>
                    {$_('options.storedWarning')}
                </div></> : null}
                <label className={'option'}>
                    <input
                        type={'checkbox'}
                        checked={$options.turbo}
                        onChange={e =>
                            editOptions(draft => {
                                draft.turbo = e.target.checked;
                            })}
                    />
                    {$_('options.turbo')}
                </label>
                <div className={'option'}>
                    <label >
                        {$_('options.framerate')}
                        <input
                            type={'number'}
                            min={'0'}
                            max={'240'}
                            value={$options.framerate}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.framerate = e.target.value === '' ? '' : Number(e.target.value);
                                })}
                        />
                    </label>
                    <LearnMore slug={'custom-fps'} />
                </div>
                <div className={'option'}>
                    <label >
                        <input
                            type={'checkbox'}
                            checked={$options.interpolation}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.interpolation = e.target.checked;
                                })}
                        />
                        {$_('options.interpolation')}
                    </label>
                    <LearnMore slug={'interpolation'} />
                </div>
                <div className={'option'}>
                    <label >
                        <input
                            type={'checkbox'}
                            checked={$options.highQualityPen}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.highQualityPen = e.target.checked;
                                })}
                        />
                        {$_('options.highQualityPen')}
                    </label>
                    <LearnMore slug={'high-quality-pen'} />
                </div>
                <div className={'option'}>
                    <label >
                        <input
                            type={'checkbox'}
                            checked={$options.maxClones === ALMOST_INFINITY}
                            onChange={e => {
                                const target = e.target; editOptions(draft => {
                                    draft.maxClones = target.checked ? ALMOST_INFINITY : 300;
                                    
                                });
                            }}
                        />
                        {$_('options.infiniteClones')}
                    </label>
                    <LearnMore slug={'infinite-clones'} />
                </div>
                <div className={'option'}>
                    <label >
                        <input
                            type={'checkbox'}
                            checked={!$options.fencing}
                            onChange={e => {
                                const target = e.target; editOptions(draft => {
                                    draft.fencing = !target.checked;
                                    
                                });
                            }}
                        />
                        {$_('options.removeFencing')}
                    </label>
                    <LearnMore slug={'remove-fencing'} />
                </div>
                <div className={'option'}>
                    <label >
                        <input
                            type={'checkbox'}
                            checked={!$options.miscLimits}
                            onChange={e => {
                                const target = e.target; editOptions(draft => {
                                    draft.miscLimits = !target.checked;
                                    
                                });
                            }}
                        />
                        {$_('options.removeMiscLimits')}
                    </label>
                    <LearnMore slug={'remove-misc-limits'} />
                </div>
                <label className={'option'}>
                    {$_('options.username')}
                    <input
                        type={'text'}
                        className={'shorter'}
                        value={$options.username}
                        onChange={e =>
                            editOptions(draft => {
                                draft.username = e.target.value;
                            })}
                    />
                </label>
                {$options.username !== defaultOptions.username && cloudVariables.length !== 0 ? <><p className={'warning'}>
                    {$_('options.customUsernameWarning')}
                </p></> : null}
                <label className={'option'}>
                    <input
                        type={'checkbox'}
                        checked={$options.closeWhenStopped}
                        onChange={e =>
                            editOptions(draft => {
                                draft.closeWhenStopped = e.target.checked;
                            })}
                    />
                    {$_('options.closeWhenStopped')}
                </label>
                <h3 >{$_('options.stage')}</h3>
                <label className={'option'}>
                    {$_('options.stageSize')}
                    <input
                        type={'number'}
                        min={'1'}
                        max={'4096'}
                        step={'1'}
                        value={$options.stageWidth}
                        onChange={e =>
                            editOptions(draft => {
                                draft.stageWidth = e.target.value === '' ? '' : Number(e.target.value);
                            })}
                    />{'\n      ×\n      '}<input
                        type={'number'}
                        min={'1'}
                        max={'4096'}
                        step={'1'}
                        value={$options.stageHeight}
                        onChange={e =>
                            editOptions(draft => {
                                draft.stageHeight = e.target.value === '' ? '' : Number(e.target.value);
                            })}
                    />
                    <LearnMore slug={'custom-stage-size'} />
                </label>
                <div className={'group'}>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'resize-mode'}
                            value={'preserve-ratio'}
                            checked={$options.resizeMode === 'preserve-ratio'}
                            onChange={e => editOptions(draft => {
                                draft.resizeMode = e.target.value;
                            })}
                        />
                        {$_('options.preserveRatio')}
                    </label>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'resize-mode'}
                            value={'stretch'}
                            checked={$options.resizeMode === 'stretch'}
                            onChange={e => editOptions(draft => {
                                draft.resizeMode = e.target.value;
                            })}
                        />
                        {$_('options.stretch')}
                    </label>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'resize-mode'}
                            value={'dynamic-resize'}
                            checked={$options.resizeMode === 'dynamic-resize'}
                            onChange={e => editOptions(draft => {
                                draft.resizeMode = e.target.value;
                            })}
                        />
                        {$_('options.dynamicResize')}
                        <LearnMore slug={'packager/dynamic-stage-resize'} />
                    </label>
                </div>
            </div>
        </Section>
        <Section
            tab={'Appearance'}
            reset={() => {
                resetOptions([
                    'app.icon',
                    'app.windowTitle',
                    'loadingScreen',
                    'autoplay',
                    'controls',
                    'appearance',
                    'monitors'
                ]);
            }}
        >
            <div >
                <h2 >{$_('options.playerOptions')}</h2>
                <label className={'option'}>
                    {$_('options.pageTitle')}
                    <input
                        type={'text'}
                        value={$options.app.windowTitle}
                        onChange={e =>
                            editOptions(draft => {
                                draft.app.windowTitle = e.target.value;
                            })}
                    />
                </label>
                <div className={'option'}>
                    {$_('options.icon')}
                    <ImageInput
                        file={$icon}
                        onChange={next =>
                            editOptions(draft => {
                                draft.app.icon = next;
                            })}
                        previewSizes={[[64, 64], [32, 32], [16, 16]]}
                    />
                </div>
                <h3 >{$_('options.loadingScreen')}</h3>
                <label className={'option'}>
                    <input
                        type={'checkbox'}
                        checked={$options.loadingScreen.progressBar}
                        onChange={e =>
                            editOptions(draft => {
                                draft.loadingScreen.progressBar = e.target.checked;
                            })}
                    />
                    {$_('options.showProgressBar')}
                </label>
                <label className={'option'}>
                    {$_('options.loadingScreenText')}
                    <input
                        type={'text'}
                        value={$options.loadingScreen.text}
                        onChange={e =>
                            editOptions(draft => {
                                draft.loadingScreen.text = e.target.value;
                            })}
                        placeholder={$_('options.loadingScreenTextPlaceholder')}
                    />
                </label>
                <div className={'option'}>
                    {$_('options.loadingScreenImage')}

                    <ImageInput
                        file={$loadingScreenImage}
                        onChange={next =>
                            editOptions(draft => {
                                draft.loadingScreen.image = next;
                            })}
                        previewSizes={[['', '']]}
                    />
                </div>
                {$loadingScreenImage ? <><label className={'option'}>
                    <input
                        type={'radio'}
                        name={'loading-screen-mode'}
                        value={'normal'}
                        checked={$options.loadingScreen.imageMode === 'normal'}
                        onChange={e => editOptions(draft => {
                            draft.loadingScreen.imageMode = e.target.value;
                        })}
                    />
                    {$_('options.sizeNormal')}
                </label>
                    <label className={'option'}>
                    <input
                            type={'radio'}
                            name={'loading-screen-mode'}
                            value={'stretch'}
                            checked={$options.loadingScreen.imageMode === 'stretch'}
                            onChange={e => editOptions(draft => {
                            draft.loadingScreen.imageMode = e.target.value;
                        })}
                        />
                    {$_('options.sizeStretch')}
                </label></> : null}
                <h3 >{$_('options.controls')}</h3>
                <div className={'group'}>
                    <label className={'option'}>
                        <input
                            type={'checkbox'}
                            checked={$options.autoplay}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.autoplay = e.target.checked;
                                })}
                        />
                        {$_('options.autoplay')}
                    </label>
                    {$options.autoplay ? <>{$_('options.autoplayHint')}</> : null}
                </div>
                <label className={'option'}>
                    <input
                        type={'checkbox'}
                        checked={$options.controls.greenFlag.enabled}
                        onChange={e =>
                            editOptions(draft => {
                                draft.controls.greenFlag.enabled = e.target.checked;
                            })}
                    />
                    {$_('options.showFlag')}
                </label>
                <label className={'option'}>
                    <input
                        type={'checkbox'}
                        checked={$options.controls.stopAll.enabled}
                        onChange={e =>
                            editOptions(draft => {
                                draft.controls.stopAll.enabled = e.target.checked;
                            })}
                    />
                    {$_('options.showStop')}
                </label>
                <label className={'option'}>
                    <input
                        type={'checkbox'}
                        checked={$options.controls.pause.enabled}
                        onChange={e =>
                            editOptions(draft => {
                                draft.controls.pause.enabled = e.target.checked;
                            })}
                    />
                    {$_('options.showPause')}
                </label>
                <label className={'option'}>
                    <input
                        type={'checkbox'}
                        checked={$options.controls.fullscreen.enabled}
                        onChange={e =>
                            editOptions(draft => {
                                draft.controls.fullscreen.enabled = e.target.checked;
                            })}
                    />
                    {$_('options.showFullscreen')}
                </label>
                <p >{$_('options.controlsHelp')}</p>
                <h3 >{$_('options.colors')}</h3>

                <label className={'option'}>
                    <ColorPicker
                        value={$options.appearance.background}
                        onChange={next =>
                            editOptions(draft => {
                                draft.appearance.background = next;
                            })}
                    />
                    {$_('options.backgroundColor')}
                </label>

                <label className={'option'}>
                    <ColorPicker
                        value={$options.appearance.foreground}
                        onChange={next =>
                            editOptions(draft => {
                                draft.appearance.foreground = next;
                            })}
                    />
                    {$_('options.foregroundColor')}
                </label>

                <label className={'option'}>
                    <ColorPicker
                        value={$options.appearance.accent}
                        onChange={next =>
                            editOptions(draft => {
                                draft.appearance.accent = next;
                            })}
                    />
                    {$_('options.accentColor')}
                </label>
                <h3 >{$_('options.monitors')}</h3>
                <label className={'option'}>
                    <input
                        type={'checkbox'}
                        checked={$options.monitors.editableLists}
                        onChange={e =>
                            editOptions(draft => {
                                draft.monitors.editableLists = e.target.checked;
                            })}
                    />
                    {$_('options.editableLists')}
                </label>

                <label className={'option'}>
                    <ColorPicker
                        value={$options.monitors.variableColor}
                        onChange={next =>
                            editOptions(draft => {
                                draft.monitors.variableColor = next;
                            })}
                    />
                    {$_('options.variableColor')}
                </label>

                <label className={'option'}>
                    <ColorPicker
                        value={$options.monitors.listColor}
                        onChange={next =>
                            editOptions(draft => {
                                draft.monitors.listColor = next;
                            })}
                    />
                    {$_('options.listColor')}
                </label>
            </div>
        </Section>
        <Section
            tab={'Appearance'}
            reset={() => {
                resetOptions([
                    'cursor',
                    'chunks'
                ]);
            }}
        >
            <div >
                <h2 >{$_('options.interaction')}</h2>
                <div className={'group'}>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'cursor-type'}
                            checked={$options.cursor.type === 'auto'}
                            onChange={e => editOptions(draft => {
                                draft.cursor.type = e.target.value;
                            })}
                            value={'auto'}
                        />
                        {$_('options.normalCursor')}
                    </label>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'cursor-type'}
                            checked={$options.cursor.type === 'none'}
                            onChange={e => editOptions(draft => {
                                draft.cursor.type = e.target.value;
                            })}
                            value={'none'}
                        />
                        {$_('options.noCursor')}
                    </label>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'cursor-type'}
                            checked={$options.cursor.type === 'custom'}
                            onChange={e => editOptions(draft => {
                                draft.cursor.type = e.target.value;
                            })}
                            value={'custom'}
                        />
                        {$_('options.customCursor')}
                    </label>
                </div>
                {$options.cursor.type === 'custom' ? <><div className={'option'}>
                    <ImageInput
                        file={$customCursorIcon}
                        onChange={next =>
                            editOptions(draft => {
                                draft.cursor.custom = next;
                            })}
                        previewSizes={[[32, 32], [16, 16]]}
                    />
                    <p >{$_('options.cursorHelp')}</p>
                    <label className={'option'}>
                        {$_('options.cursorCenter')}
                        {'\n          X: '}<input
                            type={'number'}
                            min={'0'}
                            value={$options.cursor.center.x}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.cursor.center.x = e.target.value === '' ? '' : Number(e.target.value);
                                })}
                        />{'\n          Y: '}<input
                            type={'number'}
                            min={'0'}
                            value={$options.cursor.center.y}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.cursor.center.y = e.target.value === '' ? '' : Number(e.target.value);
                                })}
                        />
                        <button
                            onClick={automaticallyCenterCursor}
                            disabled={!$customCursorIcon}
                        >
                            {$_('options.automaticallyCenter')}
                        </button>
                    </label>
                </div></> : null}
                <div className={'group'}>
                    <label className={'option'}>
                        <input
                            type={'checkbox'}
                            checked={$options.chunks.pointerlock}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.chunks.pointerlock = e.target.checked;
                                })}
                        />
                        {$_('options.pointerlock')}
                    </label>
                    <a
                        href={'https://experiments.turbowarp.org/pointerlock/'}
                        target={'_blank'}
                        rel={'noopener noreferrer'}
                    >
                        {$_('options.pointerlockHelp')}
                    </a>
                </div>
                <div className={'group'}>
                    <label className={'option'}>
                        <input
                            type={'checkbox'}
                            checked={$options.chunks.gamepad}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.chunks.gamepad = e.target.checked;
                                })}
                        />
                        {$_('options.gamepad')}
                    </label>
                    <a
                        href={'https://turbowarp.org/addons#gamepad'}
                        target={'_blank'}
                        rel={'noopener noreferrer'}
                    >
                        {$_('options.gamepadHelp')}
                    </a>
                </div>
            </div>
        </Section>
        <Section
            tab={'Advanced'}
            reset={cloudVariables.length === 0 ? null : () => {
                resetOptions([
                    'cloudVariables'
                ]);
            }}
        >
            <div >
                <h2 >{$_('options.cloudVariables')}</h2>
                {cloudVariables.length > 0 ? <><label className={'option'}>
                    {$_('options.mode')}
                    <select
                        value={$options.cloudVariables.mode}
                        onChange={e =>
                            editOptions(draft => {
                                draft.cloudVariables.mode = e.target.value;
                            })}
                    >
                        <option value={'ws'}>{$_('options.cloudVariables-ws')}</option>
                        <option value={'local'}>{$_('options.cloudVariables-local')}</option>
                        <option value={''}>{$_('options.cloudVariables-ignore')}</option>
                        <option value={'custom'}>{$_('options.cloudVariables-custom')}</option>
                    </select>
                </label>
                    {$options.cloudVariables.mode === 'custom' ? <><div >
                    {cloudVariables.map((variable, index) =>
                        (<React.Fragment key={index}><label className={'option'}>
                            <select
                                value={$options.cloudVariables.custom[variable]}
                                onChange={e =>
                                    editOptions(draft => {
                                        draft.cloudVariables.custom[variable] = e.target.value;
                                    })}
                            >
                                <option value={'ws'}>{$_('options.cloudVariables-ws')}</option>
                                <option value={'local'}>{$_('options.cloudVariables-local')}</option>
                                <option value={''}>{$_('options.cloudVariables-ignore')}</option>
                            </select>
                            {variable}
                        </label></React.Fragment>))}
                </div></> : null}
                    {$options.cloudVariables.mode === 'ws' || $options.cloudVariables.mode === 'custom' ? <><div >
                    <label className={'option'}>
                            {$_('options.cloudVariablesHost')}


                            <input
                            type={'text'}
                            value={$options.cloudVariables.cloudHost}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.cloudVariables.cloudHost = e.target.value;
                                })}
                            pattern={'wss?:.*'}
                        />
                        </label>
                </div></> : null}
                    <p >{$_('options.cloudVariables-ws-help')}</p>
                    <p >{$_('options.cloudVariables-local-help')}</p>
                    <p >{$_('options.cloudVariables-ignore-help')}</p>
                    <p >{$_('options.cloudVariables-custom-help')}</p>
                    <div className={'option'}>
                    <label >
                            <input
                            type={'checkbox'}
                            checked={$options.cloudVariables.specialCloudBehaviors}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.cloudVariables.specialCloudBehaviors = e.target.checked;
                                })}
                        />
                            {$_('options.specialCloudBehaviors')}
                        </label>
                    <LearnMore slug={'packager/special-cloud-behaviors'} />
                </div>
                    <div className={'option'}>
                    <label >
                            <input
                            type={'checkbox'}
                            checked={$options.cloudVariables.unsafeCloudBehaviors}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.cloudVariables.unsafeCloudBehaviors = e.target.checked;
                                })}
                        />
                            {$_('options.unsafeCloudBehaviors')}
                        </label>
                    <LearnMore slug={'packager/special-cloud-behaviors#eval'} />
                </div>
                    {$options.cloudVariables.unsafeCloudBehaviors ? <><p className={'warning'}>{$_('options.unsafeCloudBehaviorsWarning')}</p></> : null}
                    <p >{$_('options.implicitCloudHint').replace('{cloud}', '☁')}</p></> : <><p >{$_('options.noCloudVariables')}</p></>}
            </div>
        </Section>
        <Section
            tab={'Advanced'}
            reset={() => {
                resetOptions([
                    'compiler',
                    'extensions',
                    'bakeExtensions',
                    'custom',
                    'projectId',
                    'maxTextureDimension'
                ]);
            }}
        >
            <div >
                <h2 >{$_('options.advancedOptions')}</h2>
                <details open={advancedOptionsInitiallyOpen}>
                    <summary >{$_('options.advancedSummary')}</summary>
                    <div className={'option'}>
                        <label >
                            <input
                                type={'checkbox'}
                                checked={$options.compiler.enabled}
                                onChange={e =>
                                    editOptions(draft => {
                                        draft.compiler.enabled = e.target.checked;
                                    })}
                            />
                            {$_('options.enableCompiler')}
                        </label>
                        <LearnMore slug={'disable-compiler'} />
                    </div>
                    <div className={'option'}>
                        <label >
                            <input
                                type={'checkbox'}
                                checked={$options.compiler.warpTimer}
                                onChange={e =>
                                    editOptions(draft => {
                                        draft.compiler.warpTimer = e.target.checked;
                                    })}
                            />
                            {$_('options.warpTimer')}
                        </label>
                        <LearnMore slug={'warp-timer'} />
                    </div>


                    <label className={'option'}>
                        {$_('options.customExtensions')}

                        <LearnMore slug={'development/custom-extensions'} />
                        <CustomExtensions
                            extensions={$options.extensions}
                            onChange={next =>
                                editOptions(draft => {
                                    draft.extensions = next;
                                })}
                        />
                        <p className={'warning'}>{$_('options.customExtensionsSecurity')}</p>
                    </label>
                    <label className={'option'}>
                        <input
                            type={'checkbox'}
                            checked={$options.bakeExtensions}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.bakeExtensions = e.target.checked;
                                })}
                        />
                        {$_('options.bakeExtensions')}
                    </label>
                    <label className={'option'}>
                        {$_('options.customCSS')}
                        <textarea
                            value={$options.custom.css}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.custom.css = e.target.value;
                                })}
                        />
                    </label>
                    <label className={'option'}>
                        {$_('options.customJS')}
                        <textarea
                            value={$options.custom.js}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.custom.js = e.target.value;
                                })}
                        />
                    </label>
                    <label className={'option'}>
                        {$_('options.customCSP')}
                        <input
                            type={'text'}
                            value={$options.custom.csp}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.custom.csp = e.target.value;
                                })}
                        />
                    </label>
                    <label className={'option'}>
                        {$_('options.projectId')}
                        <input
                            type={'text'}
                            value={$options.projectId}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.projectId = e.target.value;
                                })}
                        />
                    </label>
                    <p >{$_('options.projectIdHelp')}</p>
                    <label className={'option'}>
                        <input
                            type={'checkbox'}
                            checked={$options.packagedRuntime}
                            onChange={e =>
                                editOptions(draft => {
                                    draft.packagedRuntime = e.target.checked;
                                })}
                        />
                        {$_('options.packagedRuntime')}
                    </label>
                    <label className={'option'}>
                        <input
                            type={'checkbox'}
                            checked={$options.maxTextureDimension !== defaultOptions.maxTextureDimension}
                            onChange={e => {
                                const target = e.target; editOptions(draft => {
                                    draft.maxTextureDimension = defaultOptions.maxTextureDimension * (target.checked ? 2 : 1);
                                    
                                });
                            }}
                        />
                        {$_('options.maxTextureDimension')}
                    </label>
                </details>
            </div>
        </Section>
        <Section
            tab={'Export'}
            reset={() => {
                resetOptions([
                    'target'
                ]);
            }}
        >
            <div >
                <h2 >{$_('options.environment')}</h2>
                <div className={'group'}>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'environment'}
                            checked={$options.target === 'html'}
                            onChange={e => editOptions(draft => {
                                draft.target = e.target.value;
                            })}
                            value={'html'}
                        />
                        {$_('options.html')}
                    </label>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'environment'}
                            checked={$options.target === 'zip'}
                            onChange={e => editOptions(draft => {
                                draft.target = e.target.value;
                            })}
                            value={'zip'}
                        />
                        {$_('options.zip')}
                    </label>
                </div>
                <div className={'group'}>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'environment'}
                            checked={$options.target === 'electron-win32'}
                            onChange={e => editOptions(draft => {
                                draft.target = e.target.value;
                            })}
                            value={'electron-win32'}
                        />
                        {$_('options.application-win32').replace('{type}', 'Electron')}
                    </label>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'environment'}
                            checked={$options.target === 'webview-mac'}
                            onChange={e => editOptions(draft => {
                                draft.target = e.target.value;
                            })}
                            value={'webview-mac'}
                        />
                        {$_('options.application-mac').replace('{type}', 'WKWebView')}
                    </label>
                    <label className={'option'}>
                        <input
                            type={'radio'}
                            name={'environment'}
                            checked={$options.target === 'electron-linux64'}
                            onChange={e => editOptions(draft => {
                                draft.target = e.target.value;
                            })}
                            value={'electron-linux64'}
                        />
                        {$_('options.application-linux64').replace('{type}', 'Electron')}
                    </label>
                </div>
                <details open={otherEnvironmentsInitiallyOpen}>
                    <summary >{$_('options.otherEnvironments')}</summary>
                    <p >{$_('options.otherEnvironmentsHelp')}</p>
                    <div className={'group'}>
                        <label className={'option'}>
                            <input
                                type={'radio'}
                                name={'environment'}
                                checked={$options.target === 'zip-one-asset'}
                                onChange={e => editOptions(draft => {
                                    draft.target = e.target.value;
                                })}
                                value={'zip-one-asset'}
                            />
                            {$_('options.zip-one-asset')}
                        </label>
                    </div>
                    <div className={'group'}>
                        <label className={'option'}>
                            <input
                                type={'radio'}
                                name={'environment'}
                                checked={$options.target === 'electron-win64'}
                                onChange={e => editOptions(draft => {
                                    draft.target = e.target.value;
                                })}
                                value={'electron-win64'}
                            />
                            {$_('options.application-win64').replace('{type}', 'Electron')}
                        </label>
                        <label className={'option'}>
                            <input
                                type={'radio'}
                                name={'environment'}
                                checked={$options.target === 'electron-win-arm'}
                                onChange={e => editOptions(draft => {
                                    draft.target = e.target.value;
                                })}
                                value={'electron-win-arm'}
                            />
                            {$_('options.application-win-arm').replace('{type}', 'Electron')}
                        </label>
                        <label className={'option'}>
                            <input
                                type={'radio'}
                                name={'environment'}
                                checked={$options.target === 'electron-mac'}
                                onChange={e => editOptions(draft => {
                                    draft.target = e.target.value;
                                })}
                                value={'electron-mac'}
                            />
                            {$_('options.application-mac').replace('{type}', 'Electron')}
                        </label>
                        <label className={'option'}>
                            <input
                                type={'radio'}
                                name={'environment'}
                                checked={$options.target === 'electron-linux-arm32'}
                                onChange={e => editOptions(draft => {
                                    draft.target = e.target.value;
                                })}
                                value={'electron-linux-arm32'}
                            />
                            {$_('options.application-linux-arm32').replace('{type}', 'Electron')}
                        </label>
                        <label className={'option'}>
                            <input
                                type={'radio'}
                                name={'environment'}
                                checked={$options.target === 'electron-linux-arm64'}
                                onChange={e => editOptions(draft => {
                                    draft.target = e.target.value;
                                })}
                                value={'electron-linux-arm64'}
                            />
                            {$_('options.application-linux-arm64').replace('{type}', 'Electron')}
                        </label>
                    </div>
                    <div className={'group'}>
                        <label className={'option'}>
                            <input
                                type={'radio'}
                                name={'environment'}
                                checked={$options.target === 'nwjs-win32'}
                                onChange={e => editOptions(draft => {
                                    draft.target = e.target.value;
                                })}
                                value={'nwjs-win32'}
                            />
                            {$_('options.application-win32').replace('{type}', 'NW.js')}
                        </label>
                        <label className={'option'}>
                            <input
                                type={'radio'}
                                name={'environment'}
                                checked={$options.target === 'nwjs-win64'}
                                onChange={e => editOptions(draft => {
                                    draft.target = e.target.value;
                                })}
                                value={'nwjs-win64'}
                            />
                            {$_('options.application-win64').replace('{type}', 'NW.js')}
                        </label>
                        <label className={'option'}>
                            <input
                                type={'radio'}
                                name={'environment'}
                                checked={$options.target === 'nwjs-mac'}
                                onChange={e => editOptions(draft => {
                                    draft.target = e.target.value;
                                })}
                                value={'nwjs-mac'}
                            />
                            {$_('options.application-mac').replace('{type}', 'NW.js')}
                        </label>
                        <label className={'option'}>
                            <input
                                type={'radio'}
                                name={'environment'}
                                checked={$options.target === 'nwjs-linux-x64'}
                                onChange={e => editOptions(draft => {
                                    draft.target = e.target.value;
                                })}
                                value={'nwjs-linux-x64'}
                            />
                            {$_('options.application-linux64').replace('{type}', 'NW.js')}
                        </label>
                    </div>
                </details>
            </div>
        </Section>
        {$options.target !== 'html' ? <><div >
            <Section
                tab={'Export'}
                reset={$options.target.startsWith('zip') ? null : () => {
                    resetOptions([
                        'app.packageName',
                        'app.windowMode',
                        'app.escapeBehavior'
                    ]);
                }}
            >
                <div >
                    {$options.target.startsWith('zip') ? <><h2 >{'Zip'}</h2>
                        <p >{'The zip environment is intended to be used for publishing to a website. Other uses such as sending your project to a friend over a chat app or email should use "Plain HTML" instead as zip will not work.'}</p></> : <><h2 >{$_('options.applicationSettings')}</h2>
                            <label className={'option'}>
                            {$_('options.packageName')}
                            <input
                                    type={'text'}
                                    value={$options.app.packageName}
                                    onChange={e =>
                                    editOptions(draft => {
                                        draft.app.packageName = e.target.value;
                                    })}
                                    pattern={'[\\w \\-]+'}
                                    minLength={'1'}
                                />
                        </label>
                            <p >{$_('options.packageNameHelp')}</p>
                            <label className={'option'}>
                            {$_('options.version')}
                            <input
                                    type={'text'}
                                    className={'version'}
                                    value={$options.app.version}
                                    onChange={e =>
                                    editOptions(draft => {
                                        draft.app.version = e.target.value;
                                    })}
                                    pattern={'\\d+\\.\\d+\\.\\d+'}
                                    placeholder={'1.0.0'}
                                    minLength={'1'}
                                />
                        </label>
                            <p >{$_('options.versionHelp')}</p>
                            {$options.target.includes('electron') ? <><label className={'option'}>
                            {$_('options.initalWindowSize')}
                            <select
                                    value={$options.app.windowMode}
                                    onChange={e =>
                                    editOptions(draft => {
                                        draft.app.windowMode = e.target.value;
                                    })}
                                >
                                    <option value={'window'}>{$_('options.startWindow')}</option>
                                    <option value={'maximize'}>{$_('options.startMaximized')}</option>
                                    <option value={'fullscreen'}>{$_('options.startFullscreen')}</option>
                                </select>
                        </label>
                            <label className={'option'}>
                            {$_('options.escapeBehavior')}
                            <select
                                    value={$options.app.escapeBehavior}
                                    onChange={e =>
                                    editOptions(draft => {
                                        draft.app.escapeBehavior = e.target.value;
                                    })}
                                >
                                    <option value={'unfullscreen-only'}>{$_('options.unFullscreenOnly')}</option>
                                    <option value={'exit-only'}>{$_('options.exitOnly')}</option>
                                    <option value={'unfullscreen-or-exit'}>{$_('options.unFullscreenOrExit')}</option>
                                    <option value={'nothing'}>{$_('options.doNothing')}</option>
                                </select>
                        </label>
                            <label className={'option'}>
                            {$_('options.windowControls')}
                            <select
                                    value={$options.app.windowControls}
                                    onChange={e =>
                                    editOptions(draft => {
                                        draft.app.windowControls = e.target.value;
                                    })}
                                >
                                    <option value={'default'}>{$_('options.defaultControls')}</option>
                                    <option value={'frameless'}>{$_('options.noControls')}</option>
                                </select>
                        </label></> : null}
                            <div className={'warning'}>
                            <div >{'Creating native applications for specific platforms is discouraged. In most cases, Plain HTML or Zip will have numerous advantages:'}</div>
                            <ul >
                                    <li >{'Can be run directly from a website on any platform, even phones'}</li>
                                    <li >{'Users are significantly less likely to be suspicious of a virus'}</li>
                                    <li >{'Significantly smaller file size'}</li>
                                    <li >{'Can still be downloaded locally and run offline'}</li>
                                </ul>
                            <div >{"If you don't truly need to make a self-contained application for each platform (we understand there are some cases where this is necessary), we recommend you don't."}</div>
                        </div>
                            {$options.target.includes('win') ? <><div >
                            <h2 >{'Windows'}</h2>
                            <p >{'All Windows applications generated by this site are unsigned, so users will see SmartScreen warnings when they try to run it for the first time. They can bypass these warnings by pressing "More info" then "Run anyways".'}</p>
                            <p >{'To change the icon of the executable file or create an installer program, download and run '}<a href={'https://github.com/TurboWarp/packager-extras/releases'}>{'TurboWarp Packager Extras'}</a>{' and select the output of this website.'}</p>
                        </div></> : <>{$options.target.includes('mac') ? <><div >
                                <h2 >{'macOS'}</h2>
                                <p >{'Due to Apple policy, packaging for their platforms is troublesome. You either have to:'}</p>
                                <ul >
                                <li >{'Instruct users to ignore scary Gatekeeper warnings by opening Finder > Navigating to the application > Right click > Open > Open. This website generates applications that require this workaround.'}</li>
                                <li >{'Or pay Apple $100/year for a developer account to sign and notarize the app (very involved process; reach out in feedback for more information)'}</li>
                            </ul>
                            </div></> : <>{$options.target.includes('linux') ? <><div >
                            <h2 >{'Linux'}</h2>
                            <p >{'Linux support is still experimental.'}</p>
                        </div></> : null}</>}</>}
                            {$options.target.includes('electron') ? <><div >
                            <h2 >{'Electron'}</h2>
                            <p >{'The Electron environment works by embedding a copy of Chromium (the open source part of Google Chrome) along with your project, which means the app will be very large.'}</p>
                            {$options.target.includes('win') ? <>{$options.target.includes('32') ? <><p >{'Note: You have selected the 32-bit or 64-bit mode. This maximizes device compatibility but limits the amount of memory the app can use. If you encounter crashes, try going into "Other environments" and using the 64-bit only mode instead.'}</p></> : null}</> : <>{$options.target.includes('mac') ? <><p >{'On macOS, the app will run natively on both Intel Silicon and Apple Silicon Macs.'}</p></> : <>{$options.target.includes('linux') ? <><p >{'On Linux, the application can be started by running '}<code >{'start.sh'}</code></p></> : null}</>}</>}
                        </div></> : <>{$options.target.includes('nwjs') ? <><div >
                                <h2 >{'NW.js'}</h2>
                                <p className={'warning'}>{"NW.js support is deprecated and may be removed in the future. Use the Electron environments instead. They're better in every way."}</p>
                                <p >{'The NW.js environment works by embedding a copy of Chromium (the open source part of Google Chrome) along with your project, which means the app will be very large.'}</p>
                                <p >{'For further help and steps, see '}<a href={'https://docs.nwjs.io/en/latest/For%20Users/Package%20and%20Distribute/#linux'}>{'NW.js Documentation'}</a>{'.'}</p>
                                {$options.target.includes('mac') ? <><p >{'On macOS, the app will run using Rosetta on Apple Silicon Macs.'}</p></> : null}
                            </div></> : <>{$options.target.includes('webview-mac') ? <><div >
                            <h2 >{'WKWebView'}</h2>
                            <p >{'WKWebView is the preferred way to package for macOS. It will be hundreds of MB smaller than the other macOS-specific environments and typically run the fastest.'}</p>
                            <p >{'The app will run natively on both Intel and Apple silicon Macs running macOS 10.13 or later.'}</p>
                            <p >{'Note that:'}</p>
                            <ul >
                                    <li >{'Video sensing and loudness blocks will only work in macOS 12 or later.'}</li>
                                    <li >{'Pointer lock will not work.'}</li>
                                    <li >{'Extremely large projects might not work properly.'}</li>
                                </ul>
                            <p >{'Use the "Electron macOS Application" (inside Other environments) or "Plain HTML" environments instead if you encounter these issues.'}</p>
                        </div></> : null}</>}</>}</>}
                </div>
            </Section>
        </div></> : null}
        {projectData.project.analysis.usesSteamworks ? <><Section
            tab={'Advanced'}
            reset={() => {
                resetOptions([
                    'steamworks'
                ]);
            }}
        >
            <h2 >{$_('options.steamworksExtension')}</h2>
            {['electron-win64', 'electron-linux64', 'electron-mac'].includes($options.target) ? <><p >{$_('options.steamworksAvailable').replace('{n}', '480')}</p>
                <label className={'option'}>
                    {$_('options.steamworksAppId')}
                    <input
                        pattern={'\\d+'}
                        minLength={'1'}
                        value={$options.steamworks.appId}
                        onChange={e =>
                            editOptions(draft => {
                                draft.steamworks.appId = e.target.value;
                            })}
                    />
                </label>
                <label className={'option'}>
                    {$_('options.steamworksOnError')}
                    <select
                        value={$options.steamworks.onError}
                        onChange={e =>
                            editOptions(draft => {
                                draft.steamworks.onError = e.target.value;
                            })}
                    >
                        <option value={'ignore'}>{$_('options.steamworksIgnore')}</option>
                        <option value={'warning'}>{$_('options.steamworksWarning')}</option>
                        <option value={'error'}>{$_('options.steamworksError')}</option>
                    </select>
                </label>
                {$options.target === 'electron-mac' ? <><p className={'warning'}>
                    {$_('options.steamworksMacWarning')}
                </p></> : null}</> : <><p >{$_('options.steamworksUnavailable')}</p>
                    <ul >
                    <li >{$_('options.application-win64').replace('{type}', 'Electron')}</li>
                    <li >
                            {$_('options.application-mac').replace('{type}', 'Electron')}
                            <br />
                            {$_('options.steamworksMacWarning')}
                        </li>
                    <li >{$_('options.application-linux64').replace('{type}', 'Electron')}</li>
                </ul></>}
            <p >
                <a href={'https://extensions.turbowarp.org/steamworks'}>{$_('options.steamworksDocumentation')}</a>
            </p>
        </Section></> : null}
    </>);
};
PackagerOptions.propTypes = {model: PropTypes.object.isRequired};
export default PackagerOptions;
