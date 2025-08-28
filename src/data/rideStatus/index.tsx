import { useSelector } from "react-redux";

export const ridesStatusData = () => {

  const { translateData } = useSelector((state: any) => state.setting);

  return [
    {
      id: 0,
      title: translateData.activeride,
    },
    {
      id: 1,
      title: translateData.pendingride,
    },
    {
      id: 2,
      title: translateData.schedule,
    },
    {
      id: 3,
      title: translateData.completeride,
    },
    {
      id: 4,
      title: translateData.cancelRide,
    },
  ];
}
