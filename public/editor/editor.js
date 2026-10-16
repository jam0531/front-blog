/* 旧插件只在 iframe 内运行；卸载 iframe 会一并清理其窗口事件、定时器和全局变量。 */
(function () {
  'use strict'
  var editor
  var ready = false
  var channel = 'twelve-markdown-editor'
  function send(type, data) { window.parent.postMessage(Object.assign({ channel: channel, type: type }, data), window.location.origin) }
  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin || event.source !== window.parent || !event.data || event.data.channel !== channel || !ready) return
    var message = event.data
    if (message.type === 'configure') {
      if (typeof message.value === 'string' && editor.cm.getValue() !== message.value) editor.cm.setValue(message.value)
      if (typeof message.disabled === 'boolean') {
        editor.cm.setOption('readOnly', message.disabled)
        document.body.classList.toggle('editor-readonly', message.disabled)
      }
    } else if (message.type === 'read') {
      send('content', { requestId: message.requestId, value: editor.cm.getValue() })
    }
  })
  try {
    editor = window.editormd('editor', {
      path: '../vendor/editormd/lib/', width: '100%', height: '100%',
      autoFocus: false, watch: false, toolbarAutoFixed: false, syncScrolling: false,
      htmlDecode: false, imageUpload: false, emoji: false, tex: false,
      flowChart: false, sequenceDiagram: false, saveHTMLToTextarea: false,
      placeholder: '写下你的正文，支持 Markdown…',
      disabledKeyMaps: ['F9', 'F10', 'F11', 'Ctrl-E', 'Shift-Ctrl-K'],
      toolbarIcons: ['undo', 'redo', '|', 'bold', 'italic', 'del', 'quote', '|', 'h1', 'h2', 'h3', '|', 'list-ul', 'list-ol', 'hr', '|', 'link', 'image', 'code', 'code-block', 'table'],
      onload: function () {
        editor = this
        ready = true
        this.cm.getInputField().setAttribute('aria-label', 'Markdown 正文')
        // watch=false 时插件的 onchange 不触发，直接订阅 CodeMirror 内容变化。
        this.cm.on('change', function (cm) { send('change', { value: cm.getValue() }) })
        send('ready')
      }
    })
  } catch (error) { send('failed') }
})()
