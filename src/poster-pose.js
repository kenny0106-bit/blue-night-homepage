const COINCIDENT_POSITION_TOLERANCE = 0.1
const COINCIDENT_SCALE_TOLERANCE = 0.1
const COINCIDENT_ROTATION_TOLERANCE = Math.cos(12 * Math.PI / 180)

function axis(elements, offset) {
  return [elements[offset], elements[offset + 1], elements[offset + 2]]
}

function magnitude(vector) {
  return Math.hypot(vector[0], vector[1], vector[2])
}

function axisAlignment(first, second, firstScale, secondScale) {
  const dot = first[0] * second[0] + first[1] * second[1] + first[2] * second[2]
  return dot / (firstScale * secondScale)
}

// MindAR may accept a second target from the same poster image. Do not render
// two AR planes at one camera pose; posters at distinct poses still track freely.
export function hasCoincidentPosterPose(candidateAnchor, trackedAnchor) {
  const candidate = candidateAnchor.group.matrix.elements
  const tracked = trackedAnchor.group.matrix.elements
  const candidateX = axis(candidate, 0)
  const trackedX = axis(tracked, 0)
  const candidateScale = magnitude(candidateX)
  const trackedScale = magnitude(trackedX)
  if (!candidateScale || !trackedScale) return false

  const positionDistance = Math.hypot(
    candidate[12] - tracked[12],
    candidate[13] - tracked[13],
    candidate[14] - tracked[14],
  )
  const relativePosition = positionDistance / ((candidateScale + trackedScale) / 2)
  const relativeScale = Math.abs(candidateScale - trackedScale) / Math.max(candidateScale, trackedScale)
  const axesAligned = [0, 4, 8].every(offset => {
    const candidateAxis = axis(candidate, offset)
    const trackedAxis = axis(tracked, offset)
    return axisAlignment(candidateAxis, trackedAxis, magnitude(candidateAxis), magnitude(trackedAxis))
      >= COINCIDENT_ROTATION_TOLERANCE
  })

  return relativePosition <= COINCIDENT_POSITION_TOLERANCE
    && relativeScale <= COINCIDENT_SCALE_TOLERANCE
    && axesAligned
}
