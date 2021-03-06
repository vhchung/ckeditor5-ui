/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import IconView from '../../src/icon/iconview';

describe( 'IconView', () => {
	let view;

	beforeEach( () => {
		view = new IconView();
		view.render();
	} );

	describe( 'constructor()', () => {
		it( 'sets #content', () => {
			expect( view.content ).to.equal( '' );
		} );

		it( 'sets #viewBox', () => {
			expect( view.viewBox ).to.equal( '0 0 20 20' );
		} );

		it( 'creates element from template', () => {
			expect( view.element.tagName ).to.equal( 'svg' );
			expect( view.element.getAttribute( 'class' ) ).to.equal( 'ck-icon' );
			expect( view.element.getAttribute( 'viewBox' ) ).to.equal( '0 0 20 20' );
		} );
	} );

	describe( '<svg> bindings', () => {
		describe( 'viewBox', () => {
			it( 'should react to changes in view#viewBox', () => {
				expect( view.element.getAttribute( 'viewBox' ) ).to.equal( '0 0 20 20' );

				view.viewBox = '1 2 3 4';

				expect( view.element.getAttribute( 'viewBox' ) ).to.equal( '1 2 3 4' );
			} );
		} );

		describe( 'inline svg', () => {
			it( 'should react to changes in view#content', () => {
				expect( view.element.innerHTML = '' );

				view.content = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="test"></g></svg>';
				expect( view.element.innerHTML = '<g id="test"></g>' );

				view.content = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"></svg>';
				expect( view.element.innerHTML = '' );
			} );

			it( 'works for #content with more than <svg> declaration', () => {
				expect( view.element.innerHTML = '' );

				view.content =
					'<?xml version="1.0" encoding="utf-8"?><svg version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="test"></g></svg>';
				expect( view.element.innerHTML = '<g id="test"></g>' );
			} );

			it( 'should respect parsed <svg>\'s viewBox attribute', () => {
				expect( view.element.innerHTML = '' );

				view.content = '<svg version="1.1" viewBox="10 20 30 40" xmlns="http://www.w3.org/2000/svg"><g id="test"></g></svg>';
				expect( view.viewBox ).to.equal( '10 20 30 40' );
			} );
		} );
	} );
} );
