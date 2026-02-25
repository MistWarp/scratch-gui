import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import {IconPackContext} from './icon-provider.jsx';

export {useIcon, useIconPack} from './icon-provider.jsx';
export {default as IconPackProvider} from './icon-provider.jsx';

const createIcon = iconName => {
    const Icon = ({size = 15, ...props}) => {
        const {getIcon} = useContext(IconPackContext);
        const IconComponent = getIcon(iconName);
        if (!IconComponent) return null;
        return (<IconComponent
            size={size}
            {...props}
        />);
    };

    Icon.propTypes = {
        size: PropTypes.number
    };

    Icon.defaultProps = {
        size: 15
    };

    return Icon;
};

export const Check = createIcon('Check');
export const X = createIcon('X');
export const Trash = createIcon('Trash');
export const Plus = createIcon('Plus');
export const CirclePlus = createIcon('CirclePlus');
export const Edit = createIcon('Edit');
export const Download = createIcon('Download');
export const Upload = createIcon('Upload');
export const Folder = createIcon('Folder');
export const Settings = createIcon('Settings');
export const Palette = createIcon('Palette');
export const Share = createIcon('Share');
export const Search = createIcon('Search');
export const ChevronDown = createIcon('ChevronDown');
export const ArrowLeft = createIcon('ArrowLeft');
export const Play = createIcon('Play');
export const Pause = createIcon('Pause');
export const Minimize = createIcon('Minimize');
export const Maximize = createIcon('Maximize');
export const Maximize2 = createIcon('Maximize2');
export const Eye = createIcon('Eye');
export const EyeOff = createIcon('EyeOff');
export const Copy = createIcon('Copy');
export const Globe = createIcon('Globe');
export const AlertTriangle = createIcon('AlertTriangle');
export const Info = createIcon('Info');
export const CheckCircle = createIcon('CheckCircle');
export const XCircle = createIcon('XCircle');
export const History = createIcon('History');
export const RotateCcw = createIcon('RotateCcw');
export const ExternalLink = createIcon('ExternalLink');
export const Book = createIcon('Book');
export const BookType = createIcon('BookType');
export const Computer = createIcon('Computer');
export const Sparkles = createIcon('Sparkles');
export const Paintbrush = createIcon('Paintbrush');
export const Hand = createIcon('Hand');
export const CheckCheck = createIcon('CheckCheck');
export const Keyboard = createIcon('Keyboard');
export const HelpCircle = createIcon('HelpCircle');
export const User = createIcon('User');
export const Crown = createIcon('Crown');
export const UserMinus = createIcon('UserMinus');
export const PenLine = createIcon('PenLine');
export const FilePen = createIcon('FilePen');
export const Zap = createIcon('Zap');
export const Binoculars = createIcon('Binoculars');
export const ChevronsUpDown = createIcon('ChevronsUpDown');
export const ChevronsLeftRight = createIcon('ChevronsLeftRight');
export const More = createIcon('More');
export const MoreVertical = createIcon('MoreVertical');
export const Save = createIcon('Save');
export const Undo = createIcon('Undo');
export const Redo = createIcon('Redo');
export const RefreshCw = createIcon('RefreshCw');
export const Menu = createIcon('Menu');
export const Grid = createIcon('Grid');
export const List = createIcon('List');
export const Layers = createIcon('Layers');
export const Image = createIcon('Image');
export const Code = createIcon('Code');
export const Terminal = createIcon('Terminal');
export const Database = createIcon('Database');
export const Layout = createIcon('Layout');
export const AlignLeft = createIcon('AlignLeft');
export const AlignCenter = createIcon('AlignCenter');
export const AlignRight = createIcon('AlignRight');
export const Bold = createIcon('Bold');
export const Italic = createIcon('Italic');
export const Underline = createIcon('Underline');
export const Link = createIcon('Link');
export const Unlink = createIcon('Unlink');
export const Quote = createIcon('Quote');
export const Heading = createIcon('Heading');
export const ListOrdered = createIcon('ListOrdered');
export const ListTodo = createIcon('ListTodo');
export const CheckSquare = createIcon('CheckSquare');
export const Square = createIcon('Square');
export const Star = createIcon('Star');
export const StarHalf = createIcon('StarHalf');
export const StarOff = createIcon('StarOff');
export const Heart = createIcon('Heart');
export const HeartOff = createIcon('HeartOff');
export const Settings2 = createIcon('Settings2');
export const Cog = createIcon('Cog');
export const Share2 = createIcon('Share2');
export const Filter = createIcon('Filter');
export const ChevronUp = createIcon('ChevronUp');
export const ChevronLeft = createIcon('ChevronLeft');
export const ChevronRight = createIcon('ChevronRight');
export const ArrowRight = createIcon('ArrowRight');
export const FolderOpen = createIcon('FolderOpen');
export const FolderInput = createIcon('FolderInput');
export const Scissors = createIcon('Scissors');
export const Move = createIcon('Move');
export const PlusCircle = createIcon('PlusCircle');
export const MinusCircle = createIcon('MinusCircle');
export const ZoomIn = createIcon('ZoomIn');
export const ZoomOut = createIcon('ZoomOut');
export const UploadSimple = createIcon('UploadSimple');
export const DownloadSimple = createIcon('DownloadSimple');
export const Globe2 = createIcon('Globe2');
export const Monitor = createIcon('Monitor');
export const Trash2 = createIcon('Trash2');
export const Delete = createIcon('Delete');
export const ChevronDouble = createIcon('ChevronDouble');
export const InfoCircle = createIcon('InfoCircle');
export const TriangleAlert = createIcon('TriangleAlert');
