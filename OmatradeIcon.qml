import QtQuick

// The omatrade mark, drawn rather than loaded so it can take the bar's
// colour: a rising line with the signal at its tip.
Canvas {
  id: root
  property real iconSize: 14
  // Always bound by the caller: the bar's colour in the bar, the palette's
  // text colour in the panel.
  property color color

  implicitWidth: iconSize
  implicitHeight: iconSize
  width: iconSize
  height: iconSize
  antialiasing: true

  onColorChanged: requestPaint()
  onIconSizeChanged: requestPaint()

  onPaint: {
    var ctx = getContext("2d")
    ctx.reset()
    var s = root.iconSize
    ctx.strokeStyle = root.color
    ctx.fillStyle = root.color
    ctx.lineWidth = Math.max(1.4, s * 0.13)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    ctx.beginPath()
    ctx.moveTo(s * 0.08, s * 0.78)
    ctx.lineTo(s * 0.36, s * 0.48)
    ctx.lineTo(s * 0.56, s * 0.64)
    ctx.lineTo(s * 0.80, s * 0.30)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(s * 0.82, s * 0.24, s * 0.15, 0, Math.PI * 2)
    ctx.fill()
  }
}
