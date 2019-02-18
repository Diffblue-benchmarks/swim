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

import {Tween, Transition} from "@swim/transition";
import {MemberAnimatorInherit, MemberAnimator} from "./MemberAnimator";
import {AnimatedView} from "../AnimatedView";

/** @hidden */
export class BooleanMemberAnimator<V extends AnimatedView> extends MemberAnimator<V, boolean, boolean | string> {
  constructor(view: V, value?: boolean | null, transition?: Transition<boolean> | null, inherit?: MemberAnimatorInherit) {
    super(view, value, transition, inherit);
    let animator = this;
    function accessor(): boolean | undefined;
    function accessor(value: boolean | string | null, tween?: Tween<boolean>): V;
    function accessor(value?: boolean | string | null, tween?: Tween<boolean>): boolean | null | undefined | V {
      if (value === void 0) {
        return animator.value;
      } else {
        if (typeof value === "string") {
          value = value ? true : false;
        }
        animator.setState(value, tween);
        return animator._view;
      }
    }
    (accessor as any).__proto__ = animator;
    animator = accessor as any;
    return animator;
  }
}
MemberAnimator.Boolean = BooleanMemberAnimator;
