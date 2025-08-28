export interface SOSInterface {
    success?: boolean;
    cancelationValue?: SOSDataInterface;
    sosAlertvalue?: SOSAlertDataInterface;
    loading?: boolean
}


export interface SOSDataInterface {

}

export interface SOSAlertDataInterface {
    ride_id: number,
    location_coordinates: locationInterface
}


export interface locationInterface {
    lat: string,
    lng: string
}