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

import {PointR2, BoxR2} from "@swim/math";
import {RenderingContext} from "@swim/render";
import {AnimatedViewObserver} from "./AnimatedViewObserver";
import {RenderView} from "./RenderView";

export interface RenderViewObserver<V extends RenderView = RenderView> extends AnimatedViewObserver<V> {
  viewWillRender?(context: RenderingContext, view: V): void;

  viewDidRender?(context: RenderingContext, view: V): void;

  viewWillSetHidden?(hidden: boolean, view: V): void;

  viewDidSetHidden?(hidden: boolean, view: V): void;

  viewWillCull?(view: V): void;

  viewDidCull?(view: V): void;

  viewWillSetCulled?(culled: boolean, view: V): void;

  viewDidSetCulled?(culled: boolean, view: V): void;

  viewWillSetBounds?(bounds: BoxR2, view: V): void;

  viewDidSetBounds?(newBounds: BoxR2, oldBounds: BoxR2, view: V): void;

  viewWillSetAnchor?(anchor: PointR2, view: V): void;

  viewDidSetAnchor?(newAnchor: PointR2, oldAnchor: PointR2, view: V): void;
}
