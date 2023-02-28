export default class Controller {
  #view
  #camera
  #worker
  #blinkCounterBoth = 0
  #blinkCounterLeft = 0
  #blinkCounterRight = 0
  constructor({ view, worker, camera }) {
    this.#view = view
    this.#camera = camera
    this.#worker = this.#configureWorker(worker)

    this.#view.configureOnBtnClick(this.onBtnStart.bind(this))
  }

  static async initialize(deps) {
    const controller = new Controller(deps)
    controller.log('not yet detecting eye blink! click in the button to start')
    return controller.init()
  }

  #configureWorker(worker) {
    let ready = false
    worker.onmessage = ({ data }) => {
      if ('READY' === data) {
        console.log('worker is ready!')
        this.#view.enableButton()
        ready = true
        return
      }

      const {blinkedBoth, blinkedLeft, blinkedRight} = data

      this.#blinkCounterBoth += blinkedBoth
      this.#blinkCounterLeft += blinkedLeft
      this.#blinkCounterRight += blinkedRight
      this.#view.togglePlayVideo()
      // console.log('blinked', blinked)
    }

    return {
      send(msg) {
        if (!ready) return
        worker.postMessage(msg)
      }
    }
  }
  async init() {
    console.log('init!!')
  }

  loop() {
    const video = this.#camera.video
    const img = this.#view.getVideoFrame(video)
    this.#worker.send(img)
    this.log(`detecting eye blink...`)
    setTimeout(() => this.loop(), 100)
  }
  log(text) {
    const timesBoth = `- blinkedBoth times: ${this.#blinkCounterBoth}`
    const timesLeft = `- blinkedLeft times: ${this.#blinkCounterLeft}`
    const timesRight = `- blinkedRight times: ${this.#blinkCounterRight}`
    this.#view.log(`
      status: ${text} <br /><br />
      Both: ${timesBoth} <br /><br />
      Left: ${timesLeft} <br /><br />
      Right: ${timesRight} <br /><br />
    `)
  }

  onBtnStart() {
    this.log('initializing detection...')
    this.#blinkCounterBoth = 0
    this.loop()
  }
}