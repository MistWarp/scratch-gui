import React from 'react';
import RoturConsentModal from '../../components/RoturConsentModal.jsx';
import GameMarketplaceModal from '../../components/GameMarketplaceModal.jsx';
import {blockProjectPrompts} from '../../../lib/project-prompt-blocking.js';

// Trusted prompts the sandboxed player asks this page to show: Rotur consent and the MistWarp Games marketplace.
const PlayerPrompts = ({roturModal, gameMarketplace, setGameMarketplace}) => (
    <React.Fragment>
        {roturModal ? (
            <RoturConsentModal
                type={roturModal.type}
                data={roturModal.data}
                onAllow={() => roturModal.onAllow && roturModal.onAllow()}
                onBlock={() => roturModal.onBlock && roturModal.onBlock()}
                onDeny={() => roturModal.onDeny && roturModal.onDeny()}
                onShareThis={() => roturModal.onShareThis && roturModal.onShareThis()}
                onShareAll={() => roturModal.onShareAll && roturModal.onShareAll()}
                onShareNo={() => roturModal.onShareNo && roturModal.onShareNo()}
            />
        ) : null}
        {gameMarketplace ? (
            <GameMarketplaceModal
                projectId={gameMarketplace.projectId}
                productId={gameMarketplace.productId}
                onBlockProject={() => {
                    blockProjectPrompts({id: gameMarketplace.projectId});
                    gameMarketplace.onResult({status: 'blocked'});
                    setGameMarketplace(null);
                }}
                onResult={result => {
                    gameMarketplace.onResult(result);
                    setGameMarketplace(null);
                }}
            />
        ) : null}
    </React.Fragment>
);

export default PlayerPrompts;
