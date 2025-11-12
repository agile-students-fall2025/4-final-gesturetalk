// handles webRTC peer connection
import { rtcConfig } from "../utils/rtcConfig";

export const useWebRTC = () => {
    const pc = new RTCPeerConnection(rtcConfig);

};
