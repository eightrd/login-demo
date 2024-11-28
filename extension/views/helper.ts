import { Disposable, ExtensionContext, Webview, window, workspace } from 'vscode';
import util from './util'

const pluginName = 'login-demo'
/**
 * 执行回调函数
 * @param {*} panel 
 * @param {*} message 
 * @param {*} resp 
 */
function invokeCallback(webview, message, resp) {
  console.log('回调消息：', message, resp);
  // 错误码在400-600之间的，默认弹出错误提示
  if (typeof resp == 'object' && resp.code && resp.code >= 400 && resp.code < 600) {
      util.showError(resp.message || '发生未知错误！');
  }
  webview.postMessage({cmd: 'vscodeCallback', cbid: message.cbid, data: resp});
}

/**
* 存放所有消息回调函数，根据 message.cmd 来决定调用哪个方法
*/
const messageHandler = {
  getConfig(webview, message) {
      const result = workspace.getConfiguration(pluginName).get(message.key);
      invokeCallback(webview, message, result);
  },
  setConfig(webview, message) {
      console.log('设置配置信息：', message);
      // 写入配置文件，注意，默认写入工作区配置，而不是用户配置，最后一个true表示写入全局用户配置
      workspace.getConfiguration(pluginName).update(message.key, message.value, true);
      console.log('配置信息：', workspace.getConfiguration(pluginName), workspace.getConfiguration());
      util.showInfo('修改配置成功！');
  },
  hello(webview, message) {
    window.showInformationMessage(message.data);
    webview.postMessage({ type: message.type, data: Date.now() });
  },
  hello2(webview, message) {
    this.hello(webview, message)
  },
  hello3(webview, message) {
    this.hello(webview, message)
  }
};

export class WebviewHelper {
  public static setupHtml(webview: Webview, context: ExtensionContext) {
    return process.env.VITE_DEV_SERVER_URL
      ? __getWebviewHtml__(process.env.VITE_DEV_SERVER_URL)
      : __getWebviewHtml__(webview, context);
  }

  public static setupWebviewHooks(webview: Webview, disposables: Disposable[]) {
    webview.onDidReceiveMessage(
      (message: {type: string, data: any}) => {
        const type = message.type;
        const data = message.data;
        console.log(`type: ${type}`);
        // switch (type) {
        //   case 'hello':
        //   case 'hello2':
        //   case 'hello3':
        //     window.showInformationMessage(data);
        //     webview.postMessage({ type, data: Date.now() });
        //     return;
        // }
        console.log('onDidReceiveMessage', message);
        if (messageHandler[message.type]) {
            messageHandler[message.type](webview, message);
        } else {
            util.showError(`未找到名为 ${message.type} 回调方法!`);
        }
      },
      undefined,
      disposables,
    );
  }
}
