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

package swim.server;

import swim.runtime.PartBinding;
import swim.runtime.PartProxy;
import swim.store.StoreBinding;

public final class ServerPart extends PartProxy {
  final StoreBinding store;

  ServerPart(PartBinding partBinding, StoreBinding store) {
    super(partBinding);
    this.store = store;
  }

  @Override
  public StoreBinding store() {
    return this.store;
  }

  @Override
  public void willClose() {
    this.store.close();
  }
}
