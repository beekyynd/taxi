export interface DriverInterface {
    rideData?: RideDataInterface;
    paymentData?:PaymentInterface;
    rideDatas?:RideDataInterface;
    rideUpdate?:UpdateRideInterface;
    invoiceData?:number;
    token?: string;
    loading?: boolean;
    success?: boolean;
    fcmToken?: string;
    
}


export interface RideDataInterface {
    id: number,
    ride_number:number
}

export interface PaymentInterface {
    ride_id: number,
    driver_tip: number,
    commnet: string,
    coupon: string,
    payment_method: string
}

export interface UpdateRideInterface {
    status:string,
    cancellation_reason:string
}
