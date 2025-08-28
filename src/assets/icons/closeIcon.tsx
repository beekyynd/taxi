import * as React from "react"
import Svg, { Circle, Path } from "react-native-svg"
export function CloseIcon() {
    return (
        <Svg  width={14} height={14} fill="none">
        <Path
          stroke="#fff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.2}
          d="m3.5 10.5 7-7M10.5 10.5l-7-7"
        />
      </Svg>
    )
}