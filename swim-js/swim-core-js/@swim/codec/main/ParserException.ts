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

/**
 * Thrown when a [[Parser]] parses invalid syntax.
 */
import {Diagnostic} from "./Diagnostic";

export class ParserException extends Error {
  readonly diagnostic?: Diagnostic;

  constructor(message?: Diagnostic | string) {
    super(message instanceof Diagnostic ? message.message() || void 0 : message);
    if (message instanceof Diagnostic) {
      this.diagnostic = message;
    }
    (this as any).__proto__ = ParserException.prototype;
  }

  toString(): string {
    if (this.diagnostic) {
      return this.diagnostic.toString();
    } else {
      return super.toString();
    }
  }
}