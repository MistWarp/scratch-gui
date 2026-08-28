import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {TextDecoder, TextEncoder} from 'util';

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

Enzyme.configure({adapter: new Adapter()});
