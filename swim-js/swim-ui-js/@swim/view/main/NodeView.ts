// Copyright 2015-2019 SWIM.AI inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {BoxR2} from "@swim/math";
import {Transform} from "@swim/transform";
import {View} from "./View";
import {ViewObserver} from "./ViewObserver";
import {AnimatedView} from "./AnimatedView";
import {AnimatedViewObserver} from "./AnimatedViewObserver";
import {NodeViewObserver} from "./NodeViewObserver";
import {NodeViewController} from "./NodeViewController";

export interface ViewNode extends Node {
  view?: NodeView;
}

export class NodeView extends View implements AnimatedView {
  /** @hidden */
  readonly _node: ViewNode;
  /** @hidden */
  _key: string | null;
  /** @hidden */
  _viewController: NodeViewController | null;
  /** @hidden */
  readonly _viewObservers: ViewObserver[];
  /** @hidden */
  _dirty: boolean;
  /** @hidden */
  _animationFrame: number;

  constructor(node: Node, key: string | null = null) {
    super();
    this.onAnimationFrame = this.onAnimationFrame.bind(this);
    this._node = node;
    this._node.view = this;
    this._key = key;
    this._viewController = null;
    this._viewObservers = [];
    this._dirty = false;
    this._animationFrame = 0;
    this.initNode(this._node);
  }

  get node(): ViewNode {
    return this._node;
  }

  protected initNode(node: ViewNode): void {
    // hook
  }

  key(): string | null;
  key(key: string | null): this;
  key(key?: string | null): string | null | this {
    if (key === void 0) {
      return this._key;
    } else {
      this.willSetKey(key);
      this._key = key;
      this.onSetKey(key);
      this.didSetKey(key);
      return this;
    }
  }

  get viewController(): NodeViewController | null {
    return this._viewController;
  }

  setViewController(viewController: NodeViewController | null): void {
    if (this._viewController !== viewController) {
      this.willSetViewController(viewController);
      if (this._viewController && this._viewController.setView) {
        this._viewController.setView(null);
      }
      this._viewController = viewController;
      if (this._viewController && this._viewController.setView) {
        this._viewController.setView(this);
      }
      this.onSetViewController(viewController);
      this.didSetViewController(viewController);
    }
  }

  get viewObservers(): ReadonlyArray<ViewObserver> {
    return this._viewObservers;
  }

  addViewObserver(viewObserver: ViewObserver): void {
    const viewObservers = this._viewObservers;
    const index = viewObservers.indexOf(viewObserver);
    if (index < 0) {
      this.willAddViewObserver(viewObserver);
      viewObservers.push(viewObserver);
      if (viewObserver.setView) {
        viewObserver.setView(this);
      }
      this.onAddViewObserver(viewObserver);
      this.didAddViewObserver(viewObserver);
    }
  }

  removeViewObserver(viewObserver: ViewObserver): void {
    const viewObservers = this._viewObservers;
    const index = viewObservers.indexOf(viewObserver);
    if (index >= 0) {
      this.willRemoveViewObserver(viewObserver);
      if (viewObserver.setView) {
        viewObserver.setView(null);
      }
      viewObservers.splice(index, 1);
      this.onRemoveViewObserver(viewObserver);
      this.didRemoveViewObserver(viewObserver);
    }
  }

  get parentView(): View | null {
    const parentNode = this._node.parentNode as ViewNode | null;
    if (parentNode) {
      const parentView = parentNode.view;
      if (parentView instanceof View) {
        return parentView;
      }
    }
    return null;
  }

  setParentView(parentView: View | null): void {
    this.willSetParentView(parentView);
    this.onSetParentView(parentView);
    this.didSetParentView(parentView);
  }

  get childViews(): ReadonlyArray<View> {
    const childNodes = this._node.childNodes;
    const childViews = [];
    for (let i = 0, n = childNodes.length; i < n; i += 1) {
      const childView = (childNodes[i] as ViewNode).view;
      if (childView) {
        childViews.push(childView);
      }
    }
    return childViews;
  }

  getChildView(key: string): View | null {
    const childNodes = this._node.childNodes;
    for (let i = childNodes.length - 1; i >= 0; i -= 1) {
      const childView = (childNodes[i] as ViewNode).view;
      if (childView && childView.key() === key) {
        return childView;
      }
    }
    return null;
  }

  setChildView(key: string, newChildView: View | null): View | null {
    if (!(newChildView instanceof NodeView)) {
      throw new TypeError("" + newChildView);
    }
    let oldChildView: View | null = null;
    let targetNode: Node | null = null;
    const childNodes = this._node.childNodes;
    for (let i = childNodes.length - 1; i >= 0; i -= 1) {
      const childView = (childNodes[i] as ViewNode).view as NodeView | undefined;
      if (childView && childView.key() === key) {
        oldChildView = childView;
        targetNode = childNodes[i + 1] || null;
        this.removeChildView(childView);
        break;
      }
    }
    if (newChildView) {
      newChildView.key(key);
      this.insertChild(newChildView, targetNode);
    }
    return oldChildView;
  }

  appendChild(child: View | Node): void {
    if (child instanceof View) {
      this.appendChildView(child);
    } else if (child instanceof Node) {
      this.appendChildNode(child);
    } else {
      throw new TypeError("" + child);
    }
  }

  appendChildView(childView: View): void {
    if (!(childView instanceof NodeView)) {
      throw new TypeError("" + childView);
    }
    const childNode = childView._node;
    this.willInsertChildView(childView, null);
    this.willInsertChildNode(childNode, null);
    this._node.appendChild(childNode);
    childView.setParentView(this);
    this.onInsertChildNode(childNode, null);
    this.onInsertChildView(childView, null);
    this.didInsertChildNode(childNode, null);
    this.didInsertChildView(childView, null);
  }

  appendChildNode(childNode: Node): void {
    const childView = (childNode as ViewNode).view;
    if (childView !== void 0) {
      this.willInsertChildView(childView, null);
    }
    this.willInsertChildNode(childNode, null);
    this._node.appendChild(childNode);
    if (childView !== void 0) {
      childView.setParentView(this);
    }
    this.onInsertChildNode(childNode, null);
    if (childView !== void 0) {
      this.onInsertChildView(childView, null);
    }
    this.didInsertChildNode(childNode, null);
    if (childView !== void 0) {
      this.didInsertChildView(childView, null);
    }
  }

  prependChild(child: View | Node): void {
    if (child instanceof View) {
      this.prependChildView(child);
    } else if (child instanceof Node) {
      this.prependChildNode(child);
    } else {
      throw new TypeError("" + child);
    }
  }

  prependChildView(childView: View): void {
    if (!(childView instanceof NodeView)) {
      throw new TypeError("" + childView);
    }
    const childNode = childView._node;
    const targetNode = this._node.firstChild as ViewNode | null;
    const targetView = targetNode ? targetNode.view : null;
    this.willInsertChildView(childView, targetView);
    this.willInsertChildNode(childNode, targetNode);
    this._node.insertBefore(childNode, targetNode);
    childView.setParentView(this);
    this.onInsertChildNode(childNode, targetNode);
    this.onInsertChildView(childView, targetView);
    this.didInsertChildNode(childNode, targetNode);
    this.didInsertChildView(childView, targetView);
  }

  prependChildNode(childNode: Node): void {
    const childView = (childNode as ViewNode).view;
    const targetNode = this._node.firstChild as ViewNode | null;
    const targetView = targetNode ? targetNode.view : null;
    if (childView !== void 0) {
      this.willInsertChildView(childView, targetView);
    }
    this.willInsertChildNode(childNode, targetNode);
    this._node.insertBefore(childNode, targetNode);
    if (childView !== void 0) {
      childView.setParentView(this);
    }
    this.onInsertChildNode(childNode, targetNode);
    if (childView !== void 0) {
      this.onInsertChildView(childView, targetView);
    }
    this.didInsertChildNode(childNode, targetNode);
    if (childView !== void 0) {
      this.didInsertChildView(childView, targetView);
    }
  }

  insertChild(child: View | Node, target: View | Node | null): void {
    if (child instanceof NodeView) {
      if (target instanceof View) {
        this.insertChildView(child, target);
      } else if (target instanceof Node || target === null) {
        this.insertChildNode(child._node, target);
      } else {
        throw new TypeError("" + target);
      }
    } else if (child instanceof Node) {
      if (target instanceof NodeView) {
        this.insertChildNode(child, target._node);
      } else if (target instanceof Node || target === null) {
        this.insertChildNode(child, target);
      } else {
        throw new TypeError("" + target);
      }
    } else {
      throw new TypeError("" + child);
    }
  }

  insertChildView(childView: View, targetView: View | null): void {
    if (!(childView instanceof NodeView)) {
      throw new TypeError("" + childView);
    }
    if (targetView !== null && !(targetView instanceof NodeView)) {
      throw new TypeError("" + targetView);
    }
    const childNode = childView._node;
    const targetNode = targetView ? targetView._node : null;
    this.willInsertChildView(childView, targetView);
    this.willInsertChildNode(childNode, targetNode);
    this._node.insertBefore(childNode, targetNode);
    childView.setParentView(this);
    this.onInsertChildNode(childNode, targetNode);
    this.onInsertChildView(childView, targetView);
    this.didInsertChildNode(childNode, targetNode);
    this.didInsertChildView(childView, targetView);
  }

  insertChildNode(childNode: Node, targetNode: Node | null): void {
    const childView = (childNode as ViewNode).view;
    const targetView = targetNode ? (targetNode as ViewNode).view : null;
    if (childView !== void 0) {
      this.willInsertChildView(childView, targetView);
    }
    this.willInsertChildNode(childNode, targetNode);
    this._node.insertBefore(childNode, targetNode);
    if (childView !== void 0) {
      childView.setParentView(this);
    }
    this.onInsertChildNode(childNode, targetNode);
    if (childView !== void 0) {
      this.onInsertChildView(childView, targetView);
    }
    this.didInsertChildNode(childNode, targetNode);
    if (childView !== void 0) {
      this.didInsertChildView(childView, targetView);
    }
  }

  /** @hidden */
  injectChildView(childView: NodeView, targetView: NodeView | null): void {
    const childNode = childView._node;
    const targetNode = targetView ? targetView._node : null;
    this.willInsertChildView(childView, targetView);
    this.willInsertChildNode(childNode, targetNode);
    childView.setParentView(this);
    this.onInsertChildNode(childNode, targetNode);
    this.onInsertChildView(childView, targetView);
    this.didInsertChildNode(childNode, targetNode);
    this.didInsertChildView(childView, targetView);
  }

  protected willInsertChildNode(childNode: Node, targetNode: Node | null): void {
    this.willObserve(function (viewObserver: NodeViewObserver): void {
      if (viewObserver.viewWillInsertChildNode) {
        viewObserver.viewWillInsertChildNode(childNode, targetNode, this);
      }
    });
  }

  protected onInsertChildNode(childNode: Node, targetNode: Node | null): void {
    // hook
  }

  protected didInsertChildNode(childNode: Node, targetNode: Node | null): void {
    this.didObserve(function (viewObserver: NodeViewObserver): void {
      if (viewObserver.viewDidInsertChildNode) {
        viewObserver.viewDidInsertChildNode(childNode, targetNode, this);
      }
    });
  }

  removeChild(child: View | Node): void {
    if (child instanceof View) {
      this.removeChildView(child);
    } else if (child instanceof Node) {
      this.removeChildNode(child);
    } else {
      throw new TypeError("" + child);
    }
  }

  removeChildView(childView: View): void {
    if (!(childView instanceof NodeView)) {
      throw new TypeError("" + childView);
    }
    const childNode = childView._node;
    this.willRemoveChildView(childView);
    this.willRemoveChildNode(childNode);
    childView.setParentView(null);
    this._node.removeChild(childNode);
    this.onRemoveChildNode(childNode);
    this.onRemoveChildView(childView);
    this.didRemoveChildNode(childNode);
    this.didRemoveChildView(childView);
  }

  removeChildNode(childNode: Node): void {
    const childView = (childNode as ViewNode).view;
    if (childView !== void 0) {
      this.willRemoveChildView(childView);
    }
    this.willRemoveChildNode(childNode);
    this._node.removeChild(childNode);
    if (childView !== void 0) {
      childView.setParentView(null);
    }
    this.onRemoveChildNode(childNode);
    if (childView !== void 0) {
      this.onRemoveChildView(childView);
    }
    this.didRemoveChildNode(childNode);
    if (childView !== void 0) {
      this.didRemoveChildView(childView);
    }
  }

  removeAll(): void {
    do {
      const childNode = this._node.lastChild as ViewNode | null;
      if (childNode) {
        const childView = childNode.view;
        if (childView !== void 0) {
          this.willRemoveChildView(childView);
        }
        this.willRemoveChildNode(childNode);
        this._node.removeChild(childNode);
        if (childView !== void 0) {
          childView.setParentView(null);
        }
        this.onRemoveChildNode(childNode);
        if (childView !== void 0) {
          this.onRemoveChildView(childView);
        }
        this.didRemoveChildNode(childNode);
        if (childView !== void 0) {
          this.didRemoveChildView(childView);
        }
        continue;
      }
      break;
    } while (true);
  }

  remove(): void {
    const node = this._node;
    const parentNode = node.parentNode as ViewNode | null;
    if (parentNode) {
      const parentView = parentNode.view;
      if (parentView) {
        parentView.removeChildView(this);
      } else {
        parentNode.removeChild(node);
        this.setParentView(null);
      }
    }
  }

  protected willRemoveChildNode(childNode: Node): void {
    this.willObserve(function (viewObserver: NodeViewObserver): void {
      if (viewObserver.viewWillRemoveChildNode) {
        viewObserver.viewWillRemoveChildNode(childNode, this);
      }
    });
  }

  protected onRemoveChildNode(childNode: Node): void {
    // hook
  }

  protected didRemoveChildNode(childNode: Node): void {
    this.didObserve(function (viewObserver: NodeViewObserver): void {
      if (viewObserver.viewDidRemoveChildNode) {
        viewObserver.viewDidRemoveChildNode(childNode, this);
      }
    });
  }

  text(): string | null;
  text(value: string | null): this;
  text(value?: string | null): string | null | this {
    if (value === void 0) {
      return this._node.textContent;
    } else {
      this._node.textContent = value;
      return this;
    }
  }

  isMounted(): boolean {
    let node = this._node;
    do {
      const parentNode = node.parentNode;
      if (parentNode) {
        if (parentNode.nodeType === Node.DOCUMENT_NODE) {
          return true;
        }
        node = parentNode;
        continue;
      }
      break;
    } while (true);
    return false;
  }

  cascadeMount(): void {
    this.willMount();
    this.onMount();
    const childNodes = this._node.childNodes;
    for (let i = 0, n = childNodes.length; i < n; i += 1) {
      const childView = (childNodes[i] as ViewNode).view;
      if (childView) {
        childView.cascadeMount();
      }
    }
    this.didMount();
  }

  cascadeUnmount(): void {
    this.willUnmount();
    this.onUnmount();
    const childNodes = this._node.childNodes;
    for (let i = 0, n = childNodes.length; i < n; i += 1) {
      const childView = (childNodes[i] as ViewNode).view;
      if (childView) {
        childView.cascadeUnmount();
      }
    }
    this.didUnmount();
  }

  cascadeResize(): void {
    this.willResize();
    this.onResize();
    const childNodes = this._node.childNodes;
    for (let i = 0, n = childNodes.length; i < n; i += 1) {
      const childView = (childNodes[i] as ViewNode).view;
      if (childView) {
        childView.cascadeResize();
      }
    }
    this.didResize();
  }

  animate(force: boolean = false): void {
    if (!this._animationFrame && !force) {
      this._animationFrame = requestAnimationFrame(this.onAnimationFrame);
    } else if (force) {
      if (this._animationFrame) {
        cancelAnimationFrame(this._animationFrame);
      }
      this.onAnimationFrame(performance.now());
    }
  }

  protected onAnimationFrame(timestamp: number): void {
    this._animationFrame = 0;
    this.cascadeAnimate(timestamp);
  }

  cascadeAnimate(frame: number): void {
    this.willAnimate(frame);
    this.onAnimate(frame);
    this.didAnimate(frame);
  }

  protected willAnimate(frame: number): void {
    this.willObserve(function (viewObserver: AnimatedViewObserver): void {
      if (viewObserver.viewWillAnimate) {
        viewObserver.viewWillAnimate(frame, this);
      }
    });
  }

  protected onAnimate(frame: number): void {
    // hook
  }

  protected didAnimate(frame: number): void {
    this.didObserve(function (viewObserver: AnimatedViewObserver): void {
      if (viewObserver.viewDidAnimate) {
        viewObserver.viewDidAnimate(frame, this);
      }
    });
    this.setDirty(false);
  }

  get dirty(): boolean {
    return this._dirty;
  }

  setDirty(dirty: boolean): void {
    if (dirty && !this._dirty) {
      this._dirty = true;
      this.didSetDirty(true);
    } else if (!dirty && this._dirty) {
      this._dirty = false;
      this.didSetDirty(false);
    }
  }

  protected didSetDirty(dirty: boolean): void {
    if (dirty) {
      this.animate();
    }
  }

  get parentTransform(): Transform {
    return Transform.identity();
  }

  get clientBounds(): BoxR2 {
    const range = document.createRange();
    range.selectNode(this._node);
    const bounds = range.getBoundingClientRect();
    range.detach();
    return new BoxR2(bounds.left, bounds.top, bounds.right, bounds.bottom);
  }

  get pageBounds(): BoxR2 {
    const range = document.createRange();
    range.selectNode(this._node);
    const bounds = range.getBoundingClientRect();
    range.detach();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;
    return new BoxR2(bounds.left + scrollX, bounds.top + scrollY,
                     bounds.right + scrollX, bounds.bottom + scrollY);
  }

  dispatchEvent(event: Event): boolean {
    return this._node.dispatchEvent(event);
  }

  on(type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): this {
    this._node.addEventListener(type, listener, options);
    return this;
  }

  off(type: string, listener: EventListenerOrEventListenerObject, options?: EventListenerOptions | boolean): this {
    this._node.removeEventListener(type, listener, options);
    return this;
  }
}
View.Node = NodeView;
