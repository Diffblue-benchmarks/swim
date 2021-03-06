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

import {Output} from "@swim/codec";
import {Uri} from "./Uri";
import {AnyUriPath, UriPath} from "./UriPath";

/** @hidden */
export class UriPathEmpty extends UriPath {
  /** @hidden */
  constructor() {
    super();
  }

  isDefined(): boolean {
    return false;
  }

  isAbsolute(): boolean {
    return false;
  }

  isRelative(): boolean {
    return true;
  }

  isEmpty(): boolean {
    return true;
  }

  head(): string {
    throw new Error("Empty UriPath");
  }

  tail(): UriPath {
    throw new Error("Empty UriPath");
  }

  /** @hidden */
  setTail(tail: UriPath): void {
    throw new Error("Empty UriPath");
  }

  /** @hidden */
  dealias(): UriPath {
    return this;
  }

  appended(...components: AnyUriPath[]): UriPath {
    return UriPath.from.apply(void 0, arguments);
  }

  appendedSlash(): UriPath {
    return UriPath.slash();
  }

  appendedSegment(segment: string): UriPath {
    return UriPath.segment(segment);
  }

  prepended(...components: AnyUriPath[]): UriPath {
    return UriPath.from.apply(void 0, arguments);
  }

  prependedSlash(): UriPath {
    return UriPath.slash();
  }

  prependedSegment(segment: string): UriPath {
    return UriPath.segment(segment);
  }

  merge(that: UriPath): UriPath {
    return that;
  }

  debug(output: Output): void {
    output = output.write("UriPath").write(46/*'.'*/).write("empty")
        .write(40/*'('*/).write(41/*')'*/);
  }

  display(output: Output): void {
    // nop
  }

  toString(): string {
    return "";
  }
}
Uri.PathEmpty = UriPathEmpty;
