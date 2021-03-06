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

package swim.http.header;

import swim.codec.Base10;
import swim.codec.Input;
import swim.codec.Output;
import swim.codec.Parser;
import swim.codec.Writer;
import swim.http.HttpHeader;
import swim.http.HttpParser;
import swim.http.HttpWriter;
import swim.util.Murmur3;

public final class ContentLength extends HttpHeader {
  final long length;

  ContentLength(long length) {
    this.length = length;
  }

  @Override
  public String lowerCaseName() {
    return "content-length";
  }

  @Override
  public String name() {
    return "Content-Length";
  }

  public long length() {
    return this.length;
  }

  @Override
  public Writer<?, ?> writeHttpValue(Output<?> output, HttpWriter http) {
    return Base10.writeLong(this.length, output);
  }

  @Override
  public boolean equals(Object other) {
    if (this == other) {
      return true;
    } else if (other instanceof ContentLength) {
      final ContentLength that = (ContentLength) other;
      return this.length == that.length;
    }
    return false;
  }

  @Override
  public int hashCode() {
    if (hashSeed == 0) {
      hashSeed = Murmur3.seed(ContentLength.class);
    }
    return Murmur3.mash(Murmur3.mix(hashSeed, Murmur3.hash(this.length)));
  }

  @Override
  public void debug(Output<?> output) {
    output = output.write("ContentLength").write('.').write("from").write('(')
        .debug(this.length).write(')');
  }

  private static int hashSeed;

  public static ContentLength from(long length) {
    if (length < 0L) {
      throw new IllegalArgumentException(Long.toString(length));
    }
    return new ContentLength(length);
  }

  public static Parser<ContentLength> parseHttpValue(Input input, HttpParser http) {
    return ContentLengthParser.parse(input);
  }
}
