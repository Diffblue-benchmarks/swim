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

import {Record} from "@swim/structure";
import {RecordModel, Transmuter} from "@swim/dataflow";
import {DownlinkStreamlet} from "./DownlinkStreamlet";
import {SwimRef} from "../SwimRef";

/** @hidden */
export class DownlinkTransmuter extends Transmuter {
  swim: SwimRef | undefined;

  constructor(swim?: SwimRef) {
    super();
    this.swim = swim;
  }

  transmute(model: RecordModel): Record {
    if (model.tag() === "link") {
      const streamlet = new DownlinkStreamlet(this.swim, model);
      streamlet.compile();
      return streamlet;
    }
    return model;
  }
}
