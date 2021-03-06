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

package swim.runtime.downlink;

import java.util.Collection;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicReferenceFieldUpdater;
import swim.collections.HashTrieSet;
import swim.structure.Value;
import swim.uri.Uri;

public abstract class PartialDownlinkModem<View extends DownlinkView> extends DownlinkModel<View> {
  final ConcurrentLinkedQueue<Value> upQueue;

  volatile HashTrieSet<Value> keyQueue;

  volatile Value lastKey;

  public PartialDownlinkModem(Uri meshUri, Uri hostUri, Uri nodeUri, Uri laneUri,
                              float prio, float rate, Value body) {
    super(meshUri, hostUri, nodeUri, laneUri, prio, rate, body);
    this.upQueue = new ConcurrentLinkedQueue<Value>();
    this.keyQueue = HashTrieSet.empty();
  }

  @Override
  protected boolean upQueueIsEmpty() {
    return this.upQueue.isEmpty();
  }

  @Override
  protected void queueUp(Value body) {
    this.upQueue.add(body);
  }

  protected void cueUpKey(Value key) {
    HashTrieSet<Value> oldKeyQueue;
    HashTrieSet<Value> newKeyQueue;
    do {
      oldKeyQueue = this.keyQueue;
      if (!oldKeyQueue.contains(key)) {
        newKeyQueue = oldKeyQueue.added(key);
      } else {
        newKeyQueue = oldKeyQueue;
        break;
      }
    } while (!KEY_QUEUE.compareAndSet(this, oldKeyQueue, newKeyQueue));
    if (oldKeyQueue != newKeyQueue) {
      cueUp();
    }
  }

  protected void cueUpKeys(Collection<? extends Value> keys) {
    if (!keys.isEmpty()) {
      HashTrieSet<Value> oldKeyQueue;
      HashTrieSet<Value> newKeyQueue;
      do {
        oldKeyQueue = this.keyQueue;
        newKeyQueue = oldKeyQueue.added(keys);
      } while (!KEY_QUEUE.compareAndSet(this, oldKeyQueue, newKeyQueue));
      cueUp();
    }
  }

  protected abstract Value nextUpKey(Value key);

  @Override
  protected Value nextUpQueue() {
    return this.upQueue.poll();
  }

  @Override
  protected Value nextUpCue() {
    HashTrieSet<Value> oldKeyQueue;
    HashTrieSet<Value> newKeyQueue;
    Value key;
    do {
      oldKeyQueue = this.keyQueue;
      key = oldKeyQueue.next(this.lastKey);
      newKeyQueue = oldKeyQueue.removed(key);
    } while (oldKeyQueue != newKeyQueue && !KEY_QUEUE.compareAndSet(this, oldKeyQueue, newKeyQueue));
    if (key != null) {
      this.lastKey = key;
      return nextUpKey(key);
    } else {
      return null;
    }
  }

  @Override
  protected void feedUp() {
    if (!this.keyQueue.isEmpty()) {
      cueUp();
    }
    super.feedUp();
  }

  @SuppressWarnings("unchecked")
  static final AtomicReferenceFieldUpdater<PartialDownlinkModem<?>, HashTrieSet<Value>> KEY_QUEUE =
      AtomicReferenceFieldUpdater.newUpdater((Class<PartialDownlinkModem<?>>) (Class<?>) PartialDownlinkModem.class, (Class<HashTrieSet<Value>>) (Class<?>) HashTrieSet.class, "keyQueue");
}
