/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module ui/tooltip/tooltipview
 */

import View from '../view';
import Template from '../template';

/**
 * The tooltip view class.
 *
 * @extends module:ui/view~View
 */
export default class TooltipView extends View {
	/**
	 * @inheritDoc
	 */
	constructor( locale ) {
		super( locale );

		/**
		 * The text of the tooltip visible to the user.
		 *
		 * @observable
		 * @member {String} #text
		 */
		this.set( 'text' );

		/**
		 * The position of the tooltip (south or north).
		 *
		 *		+-----------+
		 *		|   north   |
		 *		+-----------+
		 *		      V
		 *		  [element]
		 *
		 *		  [element]
		 *		      ^
		 *		+-----------+
		 *		|   south   |
		 *		+-----------+
		 *
		 * @observable
		 * @default 's'
		 * @member {'s'|'n'} #position
		 */
		this.set( 'position', 's' );

		const bind = this.bindTemplate;

		this.template = new Template( {
			tag: 'span',
			attributes: {
				class: [
					'ck-tooltip',
					bind.to( 'position', position => 'ck-tooltip_' + position ),
					bind.to( 'text', value => !value ? 'ck-hidden' : '' )
				]
			},
			children: [
				{
					tag: 'span',

					attributes: {
						class: [
							'ck-tooltip__text'
						]
					},

					children: [
						{
							text: bind.to( 'text' ),
						}
					]
				}
			]
		} );
	}
}