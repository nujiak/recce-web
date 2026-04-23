import type { Component, JSX } from 'solid-js';

import addSvg from '@material-symbols/svg-400/outlined/add.svg?raw';
import addLocationSvg from '@material-symbols/svg-400/outlined/add_location.svg?raw';
import arrowBackSvg from '@material-symbols/svg-400/outlined/arrow_back.svg?raw';
import arrowDownwardSvg from '@material-symbols/svg-400/outlined/arrow_downward.svg?raw';
import bookmarksSvg from '@material-symbols/svg-400/outlined/bookmarks.svg?raw';
import checkSvg from '@material-symbols/svg-400/outlined/check.svg?raw';
import closeSvg from '@material-symbols/svg-400/outlined/close.svg?raw';
import constructionSvg from '@material-symbols/svg-400/outlined/construction.svg?raw';
import contentCopySvg from '@material-symbols/svg-400/outlined/content_copy.svg?raw';
import deleteSvg from '@material-symbols/svg-400/outlined/delete.svg?raw';
import downloadSvg from '@material-symbols/svg-400/outlined/download.svg?raw';
import editSvg from '@material-symbols/svg-400/outlined/edit.svg?raw';
import expandMoreSvg from '@material-symbols/svg-400/outlined/keyboard_arrow_down.svg?raw';
import exploreSvg from '@material-symbols/svg-400/outlined/explore.svg?raw';
import historySvg from '@material-symbols/svg-400/outlined/history.svg?raw';
import locationOnSvg from '@material-symbols/svg-400/outlined/location_on.svg?raw';
import mapSvg from '@material-symbols/svg-400/outlined/map.svg?raw';
import myLocationSvg from '@material-symbols/svg-400/outlined/my_location.svg?raw';
import nearMeSvg from '@material-symbols/svg-400/outlined/near_me.svg?raw';
import openInNewSvg from '@material-symbols/svg-400/outlined/open_in_new.svg?raw';
import paletteSvg from '@material-symbols/svg-400/outlined/palette.svg?raw';
import routeSvg from '@material-symbols/svg-400/outlined/route.svg?raw';
import satelliteAltSvg from '@material-symbols/svg-400/outlined/satellite_alt.svg?raw';
import scheduleSvg from '@material-symbols/svg-400/outlined/schedule.svg?raw';
import settingsSvg from '@material-symbols/svg-400/outlined/settings.svg?raw';
import shareSvg from '@material-symbols/svg-400/outlined/share.svg?raw';
import sortByAlphaSvg from '@material-symbols/svg-400/outlined/sort_by_alpha.svg?raw';
import straightenSvg from '@material-symbols/svg-400/outlined/straighten.svg?raw';
import toggleOffSvg from '@material-symbols/svg-400/outlined/toggle_off.svg?raw';
import toggleOnSvg from '@material-symbols/svg-400/outlined/toggle_on.svg?raw';
import undoSvg from '@material-symbols/svg-400/outlined/undo.svg?raw';

export type IconName =
  | 'add'
  | 'add_location'
  | 'arrow_back'
  | 'arrow_downward'
  | 'bookmarks'
  | 'check'
  | 'close'
  | 'construction'
  | 'content_copy'
  | 'delete'
  | 'download'
  | 'edit'
  | 'expand_more'
  | 'explore'
  | 'history'
  | 'location_on'
  | 'map'
  | 'my_location'
  | 'near_me'
  | 'open_in_new'
  | 'palette'
  | 'route'
  | 'satellite_alt'
  | 'schedule'
  | 'settings'
  | 'share'
  | 'sort_by_alpha'
  | 'straighten'
  | 'toggle_off'
  | 'toggle_on'
  | 'undo';

const icons: Record<IconName, string> = {
  add: addSvg,
  add_location: addLocationSvg,
  arrow_back: arrowBackSvg,
  arrow_downward: arrowDownwardSvg,
  bookmarks: bookmarksSvg,
  check: checkSvg,
  close: closeSvg,
  construction: constructionSvg,
  content_copy: contentCopySvg,
  delete: deleteSvg,
  download: downloadSvg,
  edit: editSvg,
  expand_more: expandMoreSvg,
  explore: exploreSvg,
  history: historySvg,
  location_on: locationOnSvg,
  map: mapSvg,
  my_location: myLocationSvg,
  near_me: nearMeSvg,
  open_in_new: openInNewSvg,
  palette: paletteSvg,
  route: routeSvg,
  satellite_alt: satelliteAltSvg,
  schedule: scheduleSvg,
  settings: settingsSvg,
  share: shareSvg,
  sort_by_alpha: sortByAlphaSvg,
  straighten: straightenSvg,
  toggle_off: toggleOffSvg,
  toggle_on: toggleOnSvg,
  undo: undoSvg,
};

export interface IconProps {
  name: IconName;
  size?: number;
  class?: string;
  style?: JSX.CSSProperties;
}

const Icon: Component<IconProps> = (props) => (
  <span
    class={`recce-icon${props.class ? ` ${props.class}` : ''}`}
    aria-hidden="true"
    style={{
      width: `${props.size ?? 24}px`,
      height: `${props.size ?? 24}px`,
      ...(props.style ?? {}),
    }}
    innerHTML={icons[props.name]}
  />
);

export default Icon;
