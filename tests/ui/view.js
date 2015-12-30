/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global document, HTMLElement */
/* bender-tags: ui */

'use strict';

const modules = bender.amd.require(
	'core/ui/view',
	'core/ui/region',
	'core/ckeditorerror',
	'core/model'
);

let View, TestView, Model, Region, CKEditorError;
let view;

bender.tools.createSinonSandbox();

describe( 'View', () => {
	beforeEach( updateModuleReference );

	describe( 'constructor', () => {
		beforeEach( () => {
			setTestViewClass();
			setTestViewInstance();
		} );

		it( 'accepts the model', () => {
			setTestViewInstance( { a: 'foo', b: 42 } );

			expect( view.model ).to.be.an.instanceof( Model );
			expect( view ).to.have.deep.property( 'model.a', 'foo' );
			expect( view ).to.have.deep.property( 'model.b', 42 );
		} );

		it( 'defines basic view properties', () => {
			view = new View();

			expect( view.model ).to.be.null;
			expect( view.regions.length ).to.be.equal( 0 );
			expect( view.template ).to.be.null;
			expect( view._regionsSelectors ).to.be.empty;
			expect( view._el ).to.be.null;
			expect( view._template ).to.be.null;

			expect( () => {
				view.el;
			} ).to.throw( CKEditorError, /ui-view-notemplate/ );
		} );
	} );

	describe( 'init', () => {
		beforeEach( () => {
			setTestViewClass( () => ( {
				tag: 'p',
				children: [
					{ tag: 'span' },
					{ tag: 'strong' }
				]
			} ) );
		} );

		it( 'calls child regions #init', () => {
			setTestViewInstance();

			const region1 = new Region( 'x' );
			const region2 = new Region( 'y' );

			view.register( region1, el => el );
			view.register( region2, el => el );

			const spy1 = bender.sinon.spy( region1, 'init' );
			const spy2 = bender.sinon.spy( region2, 'init' );

			view.init();

			sinon.assert.calledOnce( spy1 );
			sinon.assert.calledOnce( spy2 );
		} );

		it( 'initializes view regions with string selector', () => {
			setTestViewInstance();

			const region1 = new Region( 'x' );
			const region2 = new Region( 'y' );

			view.register( region1, 'span' );
			view.register( region2, 'strong' );

			view.init();

			expect( region1.el ).to.be.equal( view.el.firstChild );
			expect( region2.el ).to.be.equal( view.el.lastChild );
		} );

		it( 'initializes view regions with function selector', () => {
			setTestViewInstance();

			const region1 = new Region( 'x' );
			const region2 = new Region( 'y' );

			view.register( region1, el => el.firstChild );
			view.register( region2, el => el.lastChild );

			view.init();

			expect( region1.el ).to.be.equal( view.el.firstChild );
			expect( region2.el ).to.be.equal( view.el.lastChild );
		} );

		it( 'initializes view regions with boolean selector', () => {
			setTestViewInstance();

			const region1 = new Region( 'x' );
			const region2 = new Region( 'y' );

			view.register( region1, true );
			view.register( region2, true );

			view.init();

			expect( region1.el ).to.be.null;
			expect( region2.el ).to.be.null;
		} );
	} );

	describe( 'addChild', () => {
		beforeEach( () => {
			setTestViewClass(
				() => ( { tag: 'p', text: 'x' } ),
				function() {
					this.register( 'x', el => el );
				}
			);

			setTestViewInstance();
		} );

		it( 'should throw when no region name', () => {
			expect( () => {
				view.addChild();
			} ).to.throw( CKEditorError, /ui-view-addchild-badrname/ );
		} );

		it( 'should throw when region does not exist', () => {
			expect( () => {
				view.addChild( 'nonexistent' );
			} ).to.throw( CKEditorError, /ui-view-addchild-noreg/ );
		} );

		it( 'should throw when no child view passed', () => {
			expect( () => {
				view.addChild( 'x' );
			} ).to.throw( CKEditorError, /ui-view-addchild-no-view/ );
		} );

		it( 'should add a child to the region views', () => {
			const childView = new View();

			view.addChild( 'x', childView );

			expect( view.getChild( 'x', 0 ) ).to.be.equal( childView );
		} );

		it( 'should add a child to the region views at the right index', () => {
			const childView1 = new View();
			const childView2 = new View();

			view.addChild( 'x', childView1 );
			view.addChild( 'x', childView2, 0 );

			expect( view.getChild( 'x', 0 ) ).to.be.equal( childView2 );
			expect( view.getChild( 'x', 1 ) ).to.be.equal( childView1 );
		} );
	} );

	describe( 'removeChild', () => {
		beforeEach( () => {
			setTestViewClass(
				() => ( { tag: 'p', text: 'x' } ),
				function() {
					this.register( 'x', el => el );
				}
			);

			setTestViewInstance();
		} );

		it( 'should throw when no region name', () => {
			expect( () => {
				view.removeChild();
			} ).to.throw( CKEditorError, /ui-view-removechild-badrname/ );
		} );

		it( 'should throw when child view passed', () => {
			expect( () => {
				view.removeChild( 'x' );
			} ).to.throw( CKEditorError, /ui-view-removechild-no-view/ );
		} );

		it( 'should throw when region does not exist', () => {
			expect( () => {
				view.removeChild( 'nonexistent', new View() );
			} ).to.throw( CKEditorError, /ui-view-removechild-noreg/ );
		} );

		it( 'should remove a child from the region views', () => {
			const childView1 = new View();
			const childView2 = new View();

			view.addChild( 'x', childView1 );
			view.addChild( 'x', childView2, 0 );

			expect( view.getChild( 'x', 0 ) ).to.be.equal( childView2 );
			expect( view.getChild( 'x', 1 ) ).to.be.equal( childView1 );

			view.removeChild( 'x', childView2 );

			expect( view.getChild( 'x', 0 ) ).to.be.equal( childView1 );

			view.removeChild( 'x', childView1 );

			expect( view.regions.get( 'x' ).views.length ).to.be.equal( 0 );
		} );
	} );

	describe( 'getChild', () => {
		beforeEach( () => {
			setTestViewClass(
				() => ( { tag: 'p', text: 'x' } ),
				function() {
					this.register( 'x', el => el );
				}
			);

			setTestViewInstance();
		} );

		it( 'should throw when region does not exist', () => {
			expect( () => {
				view.getChild( 'nonexistent', 0 );
			} ).to.throw( CKEditorError, /ui-view-getchild-noreg/ );
		} );

		it( 'should get a child from the region views', () => {
			const childView1 = new View();
			const childView2 = new View();

			view.addChild( 'x', childView1 );
			view.addChild( 'x', childView2, 0 );

			expect( view.getChild( 'x', 0 ) ).to.be.equal( childView2 );
			expect( view.getChild( 'x', 1 ) ).to.be.equal( childView1 );
		} );
	} );

	describe( 'register', () => {
		beforeEach( () => {
			setTestViewClass();
			setTestViewInstance();
		} );

		it( 'should throw when first argument is neither Region instance nor string', () => {
			expect( () => {
				view.register( new Date() );
			} ).to.throw( CKEditorError, /ui-view-register-wrongtype/ );
		} );

		it( 'should throw when missing the selector argument', () => {
			expect( () => {
				view.register( 'x' );
			} ).to.throw( CKEditorError, /ui-view-register-badselector/ );
		} );

		it( 'should throw when selector argument is of a wrong type', () => {
			expect( () => {
				view.register( 'x', new Date() );
			} ).to.throw( CKEditorError, /ui-view-register-badselector/ );

			expect( () => {
				view.register( 'x', false );
			} ).to.throw( CKEditorError, /ui-view-register-badselector/ );
		} );

		it( 'should throw when overriding an existing region but without override flag set', () => {
			expect( () => {
				view.register( 'x', true );
				view.register( new Region( 'x' ), true );
			} ).to.throw( CKEditorError, /ui-view-register-override/ );
		} );

		it( 'should register a new region with region name as a first argument', () => {
			view.register( 'x', true );

			expect( view.regions.get( 'x' ) ).to.be.an.instanceof( Region );
		} );

		it( 'should register a new region with Region instance as a first argument', () => {
			view.register( new Region( 'y' ), true );

			expect( view.regions.get( 'y' ) ).to.be.an.instanceof( Region );
		} );

		it( 'should override an existing region with override flag', () => {
			const region1 = new Region( 'x' );
			const region2 = new Region( 'x' );

			view.register( region1, true );
			view.register( region2, true, true );
			view.register( 'x', 'span', true );

			expect( view.regions.get( 'x' ) ).to.be.equal( region2 );
			expect( view._regionsSelectors.x ).to.be.equal( 'span' );
		} );

		it( 'should not override an existing region with the same region with override flag', () => {
			const region = new Region( 'x' );
			const spy = bender.sinon.spy( view.regions, 'remove' );

			view.register( region, true );
			view.register( region, true, true );

			sinon.assert.notCalled( spy );
		} );
	} );

	describe( 'el', () => {
		beforeEach( createViewInstanceWithTemplate );

		it( 'invokes out of #template', () => {
			setTestViewInstance( { a: 1 } );

			expect( view.el ).to.be.an.instanceof( HTMLElement );
			expect( view.el.nodeName ).to.be.equal( 'A' );
		} );

		it( 'can be explicitly declared', () => {
			class CustomView extends View {
				constructor() {
					super();

					this.el = document.createElement( 'span' );
				}
			}

			view = new CustomView();

			expect( view.el ).to.be.an.instanceof( HTMLElement );
		} );
	} );

	describe( 'bindToAttribute', () => {
		beforeEach( createViewInstanceWithTemplate );

		it( 'returns a function that passes arguments', () => {
			setTestViewInstance( { a: 'foo' } );

			let spy = bender.sinon.spy();
			let callback = view.bindToAttribute( 'a', spy );

			expect( spy.called ).to.be.false;

			callback( 'el', 'updater' );
			sinon.assert.calledOnce( spy );
			sinon.assert.calledWithExactly( spy, 'el', 'foo' );

			view.model.a = 'bar';
			sinon.assert.calledTwice( spy );
			expect( spy.secondCall.calledWithExactly( 'el', 'bar' ) ).to.be.true;
		} );

		it( 'allows binding attribute to the model', () => {
			setTestViewClass( function() {
				return {
					tag: 'p',
					attrs: {
						'class': this.bindToAttribute( 'foo' )
					},
					text: 'abc'
				};
			} );

			setTestViewInstance( { foo: 'bar' } );

			expect( view.el.outerHTML ).to.be.equal( '<p class="bar">abc</p>' );

			view.model.foo = 'baz';
			expect( view.el.outerHTML ).to.be.equal( '<p class="baz">abc</p>' );
		} );

		it( 'allows binding "text" to the model', () => {
			setTestViewClass( function() {
				return {
					tag: 'p',
					children: [
						{
							tag: 'b',
							text: 'baz'
						}
					],
					text: this.bindToAttribute( 'foo' )
				};
			} );

			setTestViewInstance( { foo: 'bar' } );

			expect( view.el.outerHTML ).to.be.equal( '<p>bar<b>baz</b></p>' );

			// TODO: A solution to avoid nuking the children?
			view.model.foo = 'qux';
			expect( view.el.outerHTML ).to.be.equal( '<p>qux</p>' );
		} );

		it( 'allows binding to the model with value processing', () => {
			let callback = ( el, value ) =>
				( value > 0 ? 'positive' : 'negative' );

			setTestViewClass( function() {
				return {
					tag: 'p',
					attrs: {
						'class': this.bindToAttribute( 'foo', callback )
					},
					text: this.bindToAttribute( 'foo', callback )
				};
			} );

			setTestViewInstance( { foo: 3 } );
			expect( view.el.outerHTML ).to.be.equal( '<p class="positive">positive</p>' );

			view.model.foo = -7;
			expect( view.el.outerHTML ).to.be.equal( '<p class="negative">negative</p>' );
		} );

		it( 'allows binding to the model with custom callback', () => {
			setTestViewClass( function() {
				return {
					tag: 'p',
					attrs: {
						'class': this.bindToAttribute( 'foo', ( el, value ) => {
							el.innerHTML = value;

							if ( value == 'changed' ) {
								return value;
							}
						} )
					},
					text: 'bar'
				};
			} );

			setTestViewInstance( { foo: 'moo' } );
			expect( view.el.outerHTML ).to.be.equal( '<p>moo</p>' );

			view.model.foo = 'changed';
			expect( view.el.outerHTML ).to.be.equal( '<p class="changed">changed</p>' );
		} );
	} );

	describe( 'on', () => {
		it( 'accepts plain binding', () => {
			let spy = bender.sinon.spy();

			setTestViewClass( function() {
				return {
					tag: 'p',
					on: {
						x: 'a',
					}
				};
			} );

			setTestViewInstance();

			view.on( 'a', spy );

			dispatchEvent( view.el, 'x' );
			sinon.assert.calledWithExactly( spy,
				sinon.match.has( 'name', 'a' ),
				sinon.match.has( 'target', view.el )
			);
		} );

		it( 'accepts an array of event bindings', () => {
			let spy1 = bender.sinon.spy();
			let spy2 = bender.sinon.spy();

			setTestViewClass( function() {
				return {
					tag: 'p',
					on: {
						x: [ 'a', 'b' ]
					}
				};
			} );

			setTestViewInstance();

			view.on( 'a', spy1 );
			view.on( 'b', spy2 );

			dispatchEvent( view.el, 'x' );
			sinon.assert.calledWithExactly( spy1,
				sinon.match.has( 'name', 'a' ),
				sinon.match.has( 'target', view.el )
			);
			sinon.assert.calledWithExactly( spy2,
				sinon.match.has( 'name', 'b' ),
				sinon.match.has( 'target', view.el )
			);
		} );

		it( 'accepts DOM selectors', () => {
			let spy1 = bender.sinon.spy();
			let spy2 = bender.sinon.spy();
			let spy3 = bender.sinon.spy();

			setTestViewClass( function() {
				return {
					tag: 'p',
					children: [
						{
							tag: 'span',
							attrs: {
								'class': 'y',
							},
							on: {
								'test@p': 'c'
							}
						},
						{
							tag: 'div',
							children: [
								{
									tag: 'span',
									attrs: {
										'class': 'y',
									}
								}
							],
						}
					],
					on: {
						'test@.y': 'a',
						'test@div': 'b'
					}
				};
			} );

			setTestViewInstance();

			view.on( 'a', spy1 );
			view.on( 'b', spy2 );
			view.on( 'c', spy3 );

			// Test "test@p".
			dispatchEvent( view.el, 'test' );

			sinon.assert.callCount( spy1, 0 );
			sinon.assert.callCount( spy2, 0 );
			sinon.assert.callCount( spy3, 0 );

			// Test "test@.y".
			dispatchEvent( view.el.firstChild, 'test' );

			expect( spy1.firstCall.calledWithExactly(
				sinon.match.has( 'name', 'a' ),
				sinon.match.has( 'target', view.el.firstChild )
			) ).to.be.true;

			sinon.assert.callCount( spy2, 0 );
			sinon.assert.callCount( spy3, 0 );

			// Test "test@div".
			dispatchEvent( view.el.lastChild, 'test' );

			sinon.assert.callCount( spy1, 1 );

			expect( spy2.firstCall.calledWithExactly(
				sinon.match.has( 'name', 'b' ),
				sinon.match.has( 'target', view.el.lastChild )
			) ).to.be.true;

			sinon.assert.callCount( spy3, 0 );

			// Test "test@.y".
			dispatchEvent( view.el.lastChild.firstChild, 'test' );

			expect( spy1.secondCall.calledWithExactly(
				sinon.match.has( 'name', 'a' ),
				sinon.match.has( 'target', view.el.lastChild.firstChild )
			) ).to.be.true;

			sinon.assert.callCount( spy2, 1 );
			sinon.assert.callCount( spy3, 0 );
		} );

		it( 'accepts function callbacks', () => {
			let spy1 = bender.sinon.spy();
			let spy2 = bender.sinon.spy();

			setTestViewClass( function() {
				return {
					tag: 'p',
					children: [
						{
							tag: 'span'
						}
					],
					on: {
						x: spy1,
						'y@span': [ spy2, 'c' ],
					}
				};
			} );

			setTestViewInstance();

			dispatchEvent( view.el, 'x' );
			dispatchEvent( view.el.firstChild, 'y' );

			sinon.assert.calledWithExactly( spy1,
				sinon.match.has( 'target', view.el )
			);

			sinon.assert.calledWithExactly( spy2,
				sinon.match.has( 'target', view.el.firstChild )
			);
		} );

		it( 'supports event delegation', () => {
			let spy = bender.sinon.spy();

			setTestViewClass( function() {
				return {
					tag: 'p',
					children: [
						{
							tag: 'span'
						}
					],
					on: {
						x: 'a',
					}
				};
			} );

			setTestViewInstance();

			view.on( 'a', spy );

			dispatchEvent( view.el.firstChild, 'x' );
			sinon.assert.calledWithExactly( spy,
				sinon.match.has( 'name', 'a' ),
				sinon.match.has( 'target', view.el.firstChild )
			);
		} );

		it( 'works for future elements', () => {
			let spy = bender.sinon.spy();

			setTestViewClass( function() {
				return {
					tag: 'p',
					on: {
						'test@div': 'a'
					}
				};
			} );

			setTestViewInstance();

			view.on( 'a', spy );

			let div = document.createElement( 'div' );
			view.el.appendChild( div );

			dispatchEvent( div, 'test' );
			sinon.assert.calledWithExactly( spy, sinon.match.has( 'name', 'a' ), sinon.match.has( 'target', div ) );
		} );
	} );

	describe( 'destroy', () => {
		beforeEach( createViewInstanceWithTemplate );

		it( 'should destroy the view', () => {
			view.destroy();

			expect( view.model ).to.be.null;
			expect( view.regions ).to.be.null;
			expect( view.template ).to.be.null;
			expect( view._regionsSelectors ).to.be.null;
			expect( view._el ).to.be.null;
			expect( view._template ).to.be.null;
		} );

		it( 'detaches the element from DOM', () => {
			const elRef = view.el;

			document.createElement( 'div' ).appendChild( view.el );

			view.destroy();

			expect( elRef.parentNode ).to.be.null;
		} );

		it( 'destroys child regions', () => {
			const region = new Region( 'x' );
			const spy = bender.sinon.spy( region, 'destroy' );
			const regionsRef = view.regions;
			const regionViewsRef = region.views;

			view.register( region, true );
			view.addChild( 'x', new View() );
			view.destroy();

			expect( regionsRef.length ).to.be.equal( 0 );
			expect( regionViewsRef.length ).to.be.equal( 0 );
			expect( spy.calledOnce ).to.be.true;
		} );

		it( 'detaches bound model listeners', () => {
			setTestViewClass( function() {
				return {
					tag: 'p',
					text: this.bindToAttribute( 'foo' )
				};
			} );

			setTestViewInstance( { foo: 'bar' } );

			const modelRef = view.model;
			const elRef = view.el;

			expect( view.el.outerHTML ).to.be.equal( '<p>bar</p>' );

			modelRef.foo = 'baz';
			expect( view.el.outerHTML ).to.be.equal( '<p>baz</p>' );

			view.destroy();

			modelRef.foo = 'abc';
			expect( elRef.outerHTML ).to.be.equal( '<p>baz</p>' );
		} );

		it( 'destroy a template–less view', () => {
			view = new View();

			expect( () => {
				view.destroy();
			} ).to.not.throw();
		} );
	} );
} );

function updateModuleReference() {
	View = modules[ 'core/ui/view' ];
	Region = modules[ 'core/ui/region' ];
	Model = modules[ 'core/model' ];
	CKEditorError = modules[ 'core/ckeditorerror' ];
}

function createViewInstanceWithTemplate() {
	setTestViewClass( () => ( { tag: 'a' } ) );
	setTestViewInstance();
}

function setTestViewClass( templateFn, regionsFn ) {
	TestView = class V extends View {
		constructor( model ) {
			super( model );

			if ( templateFn ) {
				this.template = templateFn.call( this );
			}

			if ( templateFn && regionsFn ) {
				regionsFn.call( this );
			}
		}
	};
}

function setTestViewInstance( model ) {
	view = new TestView( new Model( model ) );

	if ( view.template ) {
		document.body.appendChild( view.el );
	}
}

function dispatchEvent( el, domEvtName ) {
	if ( !el.parentNode ) {
		throw new Error( 'To dispatch an event, element must be in DOM. Otherwise #target is null.' );
	}

	el.dispatchEvent( new Event( domEvtName, {
		bubbles: true
	} ) );
}