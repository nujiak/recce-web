import type { Component, JSX } from 'solid-js';

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

export interface IconProps {
  name: IconName;
  size?: number;
  class?: string;
  style?: JSX.CSSProperties;
}

const Icon: Component<IconProps> = (props) => (
  <svg
    class={`recce-icon${props.class ? ` ${props.class}` : ''}`}
    aria-hidden="true"
    style={{
      width: `${props.size ?? 24}px`,
      height: `${props.size ?? 24}px`,
      ...(props.style ?? {}),
    }}
  >
    <use href={`/icons/sprite.svg#${props.name}`} />
  </svg>
);

export default Icon;
