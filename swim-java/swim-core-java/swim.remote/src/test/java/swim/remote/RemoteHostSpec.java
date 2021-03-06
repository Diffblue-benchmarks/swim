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

package swim.remote;

import java.util.concurrent.CountDownLatch;
import org.testng.TestException;
import org.testng.annotations.Test;
import swim.concurrent.Theater;
import swim.http.HttpRequest;
import swim.http.HttpResponse;
import swim.io.http.AbstractHttpService;
import swim.io.http.HttpEndpoint;
import swim.io.http.HttpResponder;
import swim.io.http.HttpServer;
import swim.io.warp.AbstractWarpServer;
import swim.runtime.PushRequest;
import swim.uri.Uri;
import swim.warp.CommandMessage;
import swim.ws.WsRequest;
import swim.ws.WsResponse;
import static org.testng.AssertJUnit.assertEquals;

public class RemoteHostSpec {
  @Test
  public void testRemoteHostConnection() {
    final Theater stage = new Theater();
    final HttpEndpoint endpoint = new HttpEndpoint(stage);
    final CountDownLatch clientUpgrade = new CountDownLatch(1);
    final CountDownLatch serverUpgrade = new CountDownLatch(1);
    final Uri hostUri = Uri.parse("swim://127.0.0.1:53556/");

    final RemoteHostClient clientHost = new RemoteHostClient(hostUri, endpoint) {
      @Override
      public void didUpgrade(HttpRequest<?> httpRequest, HttpResponse<?> httpResponse) {
        super.didUpgrade(httpRequest, httpResponse);
        clientUpgrade.countDown();
      }
      @Override
      protected void reconnect() {
        // nop
      }
    };
    final RemoteHost serverHost = new RemoteHost(hostUri) {
      @Override
      public void didUpgrade(HttpRequest<?> httpRequest, HttpResponse<?> httpResponse) {
        super.didUpgrade(httpRequest, httpResponse);
        serverUpgrade.countDown();
      }
    };
    serverHost.setHostContext(new TestHostContext(hostUri, endpoint.stage()));
    final AbstractWarpServer server = new AbstractWarpServer() {
      @Override
      public HttpResponder<?> doRequest(HttpRequest<?> httpRequest) {
        final WsRequest wsRequest = WsRequest.from(httpRequest);
        final WsResponse wsResponse = wsRequest.accept(wsSettings);
        return upgrade(serverHost, wsResponse);
      }
    };
    final AbstractHttpService service = new AbstractHttpService() {
      @Override
      public HttpServer createServer() {
        return server;
      }
    };

    try {
      stage.start();
      endpoint.start();
      endpoint.bindHttp("127.0.0.1", 53556, service);
      clientHost.setHostContext(new TestHostContext(hostUri, endpoint.stage()));
      clientUpgrade.await();
      serverUpgrade.await();
    } catch (InterruptedException cause) {
      throw new TestException(cause);
    } finally {
      endpoint.stop();
      stage.stop();
    }
  }

  @Test
  public void testRemoteHostCommands() {
    final Theater stage = new Theater();
    final HttpEndpoint endpoint = new HttpEndpoint(stage);
    final CountDownLatch clientPush = new CountDownLatch(1);
    final CountDownLatch serverPush = new CountDownLatch(1);
    final CountDownLatch clientPull = new CountDownLatch(1);
    final CountDownLatch serverPull = new CountDownLatch(1);
    final CommandMessage clientToServerCommand = new CommandMessage("swim://127.0.0.1:53556/a", "x");
    final CommandMessage serverToClientCommand = new CommandMessage("swim://127.0.0.1:53556/b", "y");
    final Uri hostUri = Uri.parse("swim://127.0.0.1:53556/");

    final RemoteHostClient clientHost = new RemoteHostClient(hostUri, endpoint) {
      @Override
      public void didUpgrade(HttpRequest<?> httpRequest, HttpResponse<?> httpResponse) {
        super.didUpgrade(httpRequest, httpResponse);
        pushUp(new TestPushRequest(clientToServerCommand));
        clientPush.countDown();
      }
      @Override
      protected void reconnect() {
        // nop
      }
    };
    final RemoteHost serverHost = new RemoteHost(hostUri) {
      @Override
      public void didUpgrade(HttpRequest<?> httpRequest, HttpResponse<?> httpResponse) {
        super.didUpgrade(httpRequest, httpResponse);
        pushUp(new TestPushRequest(serverToClientCommand));
        serverPush.countDown();
      }
    };
    serverHost.setHostContext(new TestHostContext(hostUri, endpoint.stage()) {
      @Override
      public void pushDown(PushRequest pushRequest) {
        assertEquals(pushRequest.envelope().body(), clientToServerCommand.body());
        serverPull.countDown();
      }
    });
    final AbstractWarpServer server = new AbstractWarpServer() {
      @Override
      public HttpResponder<?> doRequest(HttpRequest<?> httpRequest) {
        final WsRequest wsRequest = WsRequest.from(httpRequest);
        final WsResponse wsResponse = wsRequest.accept(wsSettings);
        return upgrade(serverHost, wsResponse);
      }
    };
    final AbstractHttpService service = new AbstractHttpService() {
      @Override
      public HttpServer createServer() {
        return server;
      }
    };

    try {
      stage.start();
      endpoint.start();
      endpoint.bindHttp("127.0.0.1", 53556, service);
      clientHost.setHostContext(new TestHostContext(hostUri, endpoint.stage()) {
        @Override
        public void pushDown(PushRequest pushRequest) {
          assertEquals(pushRequest.envelope().body(), serverToClientCommand.body());
          clientPull.countDown();
        }
      });
      clientPush.await();
      serverPush.await();
      clientPull.await();
      serverPull.await();
    } catch (InterruptedException cause) {
      throw new TestException(cause);
    } finally {
      endpoint.stop();
      stage.stop();
    }
  }
}
