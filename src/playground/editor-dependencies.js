// Keep the first editor screen ready without downloading every optional panel.
import ScratchBlocks from 'scratch-blocks';
import MenuBar from '../components/menu-bar/menu-bar.jsx';
import Blocks from '../containers/blocks.jsx';
import TargetPane from '../containers/target-pane.jsx';
import DragLayer from '../containers/drag-layer.jsx';
import Watermark from '../containers/watermark.jsx';
import Backpack from '../containers/backpack.jsx';
import {setGuiComponents} from '../components/gui/gui-components';
import LazyScratchBlocks from '../lib/tw-lazy-scratch-blocks';

setGuiComponents({MenuBar, Blocks, TargetPane, DragLayer, Watermark, Backpack});
LazyScratchBlocks.set(ScratchBlocks);
