let NewD3 = function () {
  return {
    append: function () {
      return NewD3()
    },
    attr: function () {
      return this
    },
    style: function () {
      return this
    },
    text: function () {
      return this
    },
    0: {
      0: {
        getBBox: function () {
          return {
            height: 10,
            width: 20
          }
        }
      }
    }
  }
}

export const select = function () {
  return new NewD3()
}

export const selectAll = function () {
  return new NewD3()
}

export const curveBasis = 'basis'
export const curveLinear = 'linear'
export const curveCardinal = 'cardinal'
