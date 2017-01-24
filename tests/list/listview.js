/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ViewCollection from '../../src/viewcollection';
import ListView from '../../src/list/listview';

describe( 'ListView', () => {
	let view;

	beforeEach( () => {
		return ( view = new ListView() ).init();
	} );

	describe( 'constructor()', () => {
		it( 'creates element from template', () => {
			expect( view.element.classList.contains( 'ck-reset' ) ).to.be.true;
			expect( view.element.classList.contains( 'ck-list' ) ).to.be.true;
		} );

		it( 'creates view#children collection', () => {
			expect( view.items ).to.be.instanceOf( ViewCollection );
			expect( view.template.children ).to.have.length( 1 );
			expect( view.template.children.get( 0 ) ).to.equal( view.items );
		} );
	} );
} );