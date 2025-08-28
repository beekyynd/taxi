export interface AmbulanceInterface {
    loading?: boolean;
    fcmToken?: string;
    ambulanceList?: ambulanceDataInterface;
    ambulanceRequest?: ambulanceRequestInterface;
    token?: string;
    success?: boolean;
    statusCode?:number;
}


export interface ambulanceRequestInterface {

}