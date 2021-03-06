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

import {Output, WriterException, Writer, Base64} from "@swim/codec";

/** @hidden */
export class DataWriter extends Writer {
  private readonly _array: Uint8Array;
  private readonly _part: Writer | undefined;
  private readonly _step: number | undefined;

  constructor(array: Uint8Array, part?: Writer, step?: number) {
    super();
    this._array = array;
    this._part = part;
    this._step = step;
  }

  pull(output: Output): Writer {
    return DataWriter.write(output, this._array, this._part, this._step);
  }

  static sizeOf(length: number): number {
    return 1 + ((Math.floor(length * 4 / 3) + 3) & ~3);
  }

  static write(output: Output, array: Uint8Array, part?: Writer,
               step: number = 1): Writer {
    if (step === 1 && output.isCont()) {
      output = output.write(37/*'%'*/);
      step = 2;
    }
    if (step === 2) {
      if (!part) {
        part = Base64.standard().writeUint8Array(array, output);
      } else {
        part = part.pull(output);
      }
      if (part.isDone()) {
        part = void 0;
        return Writer.done();
      } else if (part.isError()) {
        return part.asError();
      }
    }
    if (output.isDone()) {
      return Writer.error(new WriterException("truncated"));
    } else if (output.isError()) {
      return Writer.error(output.trap());
    }
    return new DataWriter(array, part, step);
  }
}
