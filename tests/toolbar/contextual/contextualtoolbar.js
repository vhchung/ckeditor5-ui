/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
import ContextualToolbar from '../../../src/toolbar/contextual/contextualtoolbar';
import ContextualBalloon from '../../../src/panel/balloon/contextualballoon';
import BalloonPanelView from '../../../src/panel/balloon/balloonpanelview';
import ToolbarView from '../../../src/toolbar/toolbarview';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';

import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model.js';

/* global document, setTimeout, window */

describe( 'ContextualToolbar', () => {
	let sandbox, editor, model, selection, editingView, contextualToolbar, balloon, editorElement;

	beforeEach( () => {
		sandbox = sinon.sandbox.create();

		editorElement = document.createElement( 'div' );
		document.body.appendChild( editorElement );

		return ClassicTestEditor
			.create( editorElement, {
				plugins: [ Paragraph, Bold, Italic, ContextualToolbar ],
				contextualToolbar: [ 'bold', 'italic' ]
			} )
			.then( newEditor => {
				editor = newEditor;
				model = editor.model;
				editingView = editor.editing.view;
				selection = model.document.selection;
				contextualToolbar = editor.plugins.get( ContextualToolbar );
				balloon = editor.plugins.get( ContextualBalloon );

				editingView.attachDomRoot( editorElement );

				// There is no point to execute BalloonPanelView attachTo and pin methods so lets override it.
				sandbox.stub( balloon.view, 'attachTo' ).returns( {} );
				sandbox.stub( balloon.view, 'pin' ).returns( {} );

				// Focus the engine.
				editingView.isFocused = true;
				editingView.getDomRoot().focus();

				// Remove all selection ranges from DOM before testing.
				window.getSelection().removeAllRanges();
			} );
	} );

	afterEach( () => {
		sandbox.restore();
		editorElement.remove();

		return editor.destroy();
	} );

	it( 'should create a plugin instance', () => {
		expect( contextualToolbar ).to.instanceOf( Plugin );
		expect( contextualToolbar ).to.instanceOf( ContextualToolbar );
		expect( contextualToolbar.toolbarView ).to.instanceof( ToolbarView );
		expect( contextualToolbar.toolbarView.element.classList.contains( 'ck-editor-toolbar' ) ).to.be.true;
		expect( contextualToolbar.toolbarView.element.classList.contains( 'ck-toolbar_floating' ) ).to.be.true;
	} );

	it( 'should load ContextualBalloon', () => {
		expect( balloon ).to.instanceof( ContextualBalloon );
	} );

	it( 'should create components from config', () => {
		expect( contextualToolbar.toolbarView.items ).to.length( 2 );
	} );

	it( 'should accept the extended format of the toolbar config', () => {
		const editorElement = document.createElement( 'div' );
		document.body.appendChild( editorElement );

		return ClassicTestEditor
			.create( editorElement, {
				plugins: [ Paragraph, Bold, Italic, Underline, ContextualToolbar ],
				contextualToolbar: {
					items: [ 'bold', 'italic', 'underline' ]
				}
			} )
			.then( editor => {
				const contextualToolbar = editor.plugins.get( ContextualToolbar );

				expect( contextualToolbar.toolbarView.items ).to.length( 3 );

				editorElement.remove();

				return editor.destroy();
			} );
	} );

	it( 'should fire internal `_selectionChangeDebounced` event 200 ms after last selection change', done => {
		// This test uses setTimeout to test lodash#debounce because sinon fake timers
		// doesn't work with lodash. Lodash keeps time related stuff in a closure
		// and sinon is not able to override it.

		const spy = sandbox.spy();
		setData( model, '<paragraph>[bar]</paragraph>' );
		contextualToolbar.on( '_selectionChangeDebounced', spy );

		selection.fire( 'change:range', {} );

		// Not yet.
		sinon.assert.notCalled( spy );

		// Lets wait 100 ms.
		setTimeout( () => {
			// Still not yet.
			sinon.assert.notCalled( spy );

			// Fire event one more time.
			selection.fire( 'change:range', {} );

			// Another 100 ms waiting.
			setTimeout( () => {
				// Still not yet.
				sinon.assert.notCalled( spy );

				// Another waiting.
				setTimeout( () => {
					// And here it is.
					sinon.assert.calledOnce( spy );
					done();
				}, 110 );
			}, 101 );
		}, 100 );
	} );

	describe( 'pluginName', () => {
		it( 'should return plugin by its name', () => {
			expect( editor.plugins.get( 'ContextualToolbar' ) ).to.equal( contextualToolbar );
		} );
	} );

	describe( 'show()', () => {
		let balloonAddSpy, backwardSelectionRect, forwardSelectionRect;

		beforeEach( () => {
			backwardSelectionRect = {
				top: 100,
				height: 10,
				bottom: 110,
				left: 200,
				width: 50,
				right: 250
			};

			forwardSelectionRect = {
				top: 200,
				height: 10,
				bottom: 210,
				left: 200,
				width: 50,
				right: 250
			};

			stubSelectionRects( [
				backwardSelectionRect,
				forwardSelectionRect
			] );

			balloonAddSpy = sandbox.spy( balloon, 'add' );
			editingView.isFocused = true;
		} );

		it( 'should add #toolbarView to the #_balloon and attach the #_balloon to the selection for the forward selection', () => {
			setData( model, '<paragraph>b[a]r</paragraph>' );

			const defaultPositions = BalloonPanelView.defaultPositions;

			contextualToolbar.show();

			sinon.assert.calledWith( balloonAddSpy, {
				view: contextualToolbar.toolbarView,
				balloonClassName: 'ck-toolbar-container ck-editor-toolbar-container',
				position: {
					target: sinon.match.func,
					positions: [
						defaultPositions.southEastArrowNorth,
						defaultPositions.southEastArrowNorthEast,
						defaultPositions.southEastArrowNorthWest,
						defaultPositions.northEastArrowSouth,
						defaultPositions.northEastArrowSouthEast,
						defaultPositions.northEastArrowSouthWest
					]
				}
			} );

			expect( balloonAddSpy.firstCall.args[ 0 ].position.target() ).to.deep.equal( forwardSelectionRect );
		} );

		// https://github.com/ckeditor/ckeditor5-ui/issues/308
		it( 'should ignore the zero-width orphan rect if there another one preceding it for the forward selection', () => {
			// Restore previous stubSelectionRects() call.
			editingView.domConverter.viewRangeToDom.restore();

			// Simulate an "orphan" rect preceded by a "correct" one.
			stubSelectionRects( [
				forwardSelectionRect,
				{ width: 0 }
			] );

			setData( model, '<paragraph>b[a]r</paragraph>' );

			contextualToolbar.show();
			expect( balloonAddSpy.firstCall.args[ 0 ].position.target() ).to.deep.equal( forwardSelectionRect );
		} );

		it( 'should add #toolbarView to the #_balloon and attach the #_balloon to the selection for the backward selection', () => {
			setData( model, '<paragraph>b[a]r</paragraph>', { lastRangeBackward: true } );

			const defaultPositions = BalloonPanelView.defaultPositions;

			contextualToolbar.show();

			sinon.assert.calledWithExactly( balloonAddSpy, {
				view: contextualToolbar.toolbarView,
				balloonClassName: 'ck-toolbar-container ck-editor-toolbar-container',
				position: {
					target: sinon.match.func,
					positions: [
						defaultPositions.northWestArrowSouth,
						defaultPositions.northWestArrowSouthWest,
						defaultPositions.northWestArrowSouthEast,
						defaultPositions.southWestArrowNorth,
						defaultPositions.southWestArrowNorthWest,
						defaultPositions.southWestArrowNorthEast
					]
				}
			} );

			expect( balloonAddSpy.firstCall.args[ 0 ].position.target() ).to.deep.equal( backwardSelectionRect );
		} );

		it( 'should update balloon position on ViewDocument#render event while balloon is added to the #_balloon', () => {
			setData( model, '<paragraph>b[a]r</paragraph>' );

			const spy = sandbox.spy( balloon, 'updatePosition' );

			editingView.fire( 'render' );

			contextualToolbar.show();
			sinon.assert.notCalled( spy );

			editingView.fire( 'render' );
			sinon.assert.calledOnce( spy );
		} );

		it( 'should not add #toolbarView to the #_balloon more than once', () => {
			setData( model, '<paragraph>b[a]r</paragraph>' );

			contextualToolbar.show();
			contextualToolbar.show();
			sinon.assert.calledOnce( balloonAddSpy );
		} );

		it( 'should not add #toolbarView to the #_balloon when all components inside #toolbarView are disabled', () => {
			Array.from( contextualToolbar.toolbarView.items ).forEach( item => {
				item.isEnabled = false;
			} );
			setData( model, '<paragraph>b[a]r</paragraph>' );

			contextualToolbar.show();
			sinon.assert.notCalled( balloonAddSpy );
		} );

		it( 'should add #toolbarView to the #_balloon when at least one component inside does not have #isEnabled interface', () => {
			Array.from( contextualToolbar.toolbarView.items ).forEach( item => {
				item.isEnabled = false;
			} );

			delete contextualToolbar.toolbarView.items.get( 0 ).isEnabled;

			setData( model, '<paragraph>b[a]r</paragraph>' );

			contextualToolbar.show();
			sinon.assert.calledOnce( balloonAddSpy );
		} );

		describe( 'on #_selectionChangeDebounced event', () => {
			let showSpy;

			beforeEach( () => {
				showSpy = sandbox.spy( contextualToolbar, 'show' );
			} );

			it( 'should not be called when the editor is not focused', () => {
				setData( model, '<paragraph>b[a]r</paragraph>' );
				editingView.isFocused = false;

				contextualToolbar.fire( '_selectionChangeDebounced' );
				sinon.assert.notCalled( showSpy );
			} );

			it( 'should not be called when the selection is collapsed', () => {
				setData( model, '<paragraph>b[]ar</paragraph>' );

				contextualToolbar.fire( '_selectionChangeDebounced' );
				sinon.assert.notCalled( showSpy );
			} );

			it( 'should be called when the selection is not collapsed and editor is focused', () => {
				setData( model, '<paragraph>b[a]r</paragraph>' );
				editingView.isFocused = true;

				contextualToolbar.fire( '_selectionChangeDebounced' );
				sinon.assert.calledOnce( showSpy );
			} );
		} );
	} );

	describe( 'hide()', () => {
		let removeBalloonSpy;

		beforeEach( () => {
			removeBalloonSpy = sandbox.stub( balloon, 'remove' ).returns( {} );
			editingView.isFocused = true;
		} );

		it( 'should remove #toolbarView from the #_balloon', () => {
			setData( model, '<paragraph>b[a]r</paragraph>' );

			contextualToolbar.show();

			contextualToolbar.hide();
			sinon.assert.calledWithExactly( removeBalloonSpy, contextualToolbar.toolbarView );
		} );

		it( 'should stop update balloon position on ViewDocument#render event', () => {
			setData( model, '<paragraph>b[a]r</paragraph>' );

			const spy = sandbox.spy( balloon, 'updatePosition' );

			contextualToolbar.show();
			contextualToolbar.hide();

			editingView.fire( 'render' );
			sinon.assert.notCalled( spy );
		} );

		it( 'should not remove #ttolbarView when is not added to the #_balloon', () => {
			contextualToolbar.hide();

			sinon.assert.notCalled( removeBalloonSpy );
		} );
	} );

	describe( 'destroy()', () => {
		it( 'can be called multiple times', () => {
			expect( () => {
				contextualToolbar.destroy();
				contextualToolbar.destroy();
			} ).to.not.throw();
		} );

		it( 'should not fire `_selectionChangeDebounced` after plugin destroy', done => {
			const spy = sandbox.spy();

			contextualToolbar.on( '_selectionChangeDebounced', spy );

			selection.fire( 'change:range', { directChange: true } );

			contextualToolbar.destroy();

			setTimeout( () => {
				sinon.assert.notCalled( spy );
				done();
			}, 200 );
		} );
	} );

	describe( 'showing and hiding', () => {
		let showPanelSpy, hidePanelSpy;

		beforeEach( () => {
			setData( model, '<paragraph>[bar]</paragraph>' );

			showPanelSpy = sandbox.spy( contextualToolbar, 'show' );
			hidePanelSpy = sandbox.spy( contextualToolbar, 'hide' );
		} );

		it( 'should open when selection stops changing', () => {
			sinon.assert.notCalled( showPanelSpy );
			sinon.assert.notCalled( hidePanelSpy );

			contextualToolbar.fire( '_selectionChangeDebounced' );

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.notCalled( hidePanelSpy );
		} );

		it( 'should close when selection starts changing by a directChange', () => {
			contextualToolbar.fire( '_selectionChangeDebounced' );

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.notCalled( hidePanelSpy );

			selection.fire( 'change:range', { directChange: true } );

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.calledOnce( hidePanelSpy );
		} );

		it( 'should not close when selection starts changing by not a directChange', () => {
			contextualToolbar.fire( '_selectionChangeDebounced' );

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.notCalled( hidePanelSpy );

			selection.fire( 'change:range', { directChange: false } );

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.notCalled( hidePanelSpy );
		} );

		it( 'should close when selection starts changing by not a directChange but will become collapsed', () => {
			contextualToolbar.fire( '_selectionChangeDebounced' );

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.notCalled( hidePanelSpy );

			// Collapse range silently (without firing `change:range` { directChange: true } event).
			const range = selection._ranges[ 0 ];
			range.end = range.start;

			selection.fire( 'change:range', { directChange: false } );

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.calledOnce( hidePanelSpy );
		} );

		it( 'should hide if the editor loses focus', () => {
			editor.ui.focusTracker.isFocused = true;

			contextualToolbar.fire( '_selectionChangeDebounced' );

			const stub = sandbox.stub( balloon, 'visibleView' ).get( () => contextualToolbar.toolbarView );

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.notCalled( hidePanelSpy );

			editor.ui.focusTracker.isFocused = false;

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.calledOnce( hidePanelSpy );

			stub.restore();
		} );

		it( 'should not hide if the editor loses focus and #toolbarView is not visible', () => {
			editor.ui.focusTracker.isFocused = true;

			contextualToolbar.fire( '_selectionChangeDebounced' );

			const stub = sandbox.stub( balloon, 'visibleView' ).get( () => null );

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.notCalled( hidePanelSpy );

			editor.ui.focusTracker.isFocused = false;

			sinon.assert.calledOnce( showPanelSpy );
			sinon.assert.notCalled( hidePanelSpy );

			stub.restore();
		} );
	} );

	describe( 'show event', () => {
		it( 'should fire `show` event just before panel shows', () => {
			const spy = sandbox.spy();

			contextualToolbar.on( 'show', spy );
			setData( model, '<paragraph>b[a]r</paragraph>' );

			contextualToolbar.show();
			sinon.assert.calledOnce( spy );
		} );

		it( 'should not show the panel when `show` event is stopped', () => {
			const balloonAddSpy = sandbox.spy( balloon, 'add' );

			setData( model, '<paragraph>b[a]r</paragraph>' );

			contextualToolbar.on( 'show', evt => evt.stop(), { priority: 'high' } );

			contextualToolbar.show();
			sinon.assert.notCalled( balloonAddSpy );
		} );
	} );

	function stubSelectionRects( rects ) {
		const originalViewRangeToDom = editingView.domConverter.viewRangeToDom;

		// Mock selection rect.
		sandbox.stub( editingView.domConverter, 'viewRangeToDom' ).callsFake( ( ...args ) => {
			const domRange = originalViewRangeToDom.apply( editingView.domConverter, args );

			sandbox.stub( domRange, 'getClientRects' )
				.returns( rects );

			return domRange;
		} );
	}
} );
