import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {TextDecoder, TextEncoder as NodeTextEncoder} from 'util';

// Node's TextEncoder returns bytes from Node's realm. JSZip (and anything else
// using instanceof Uint8Array) runs in the jsdom realm, so copy the bytes into
// the realm that the test environment exposes.
class TextEncoder extends NodeTextEncoder {
    encode (input = '') {
        return new Uint8Array(super.encode(input));
    }
}

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;

Enzyme.configure({adapter: new Adapter()});
