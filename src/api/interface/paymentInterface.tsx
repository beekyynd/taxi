export interface PaymentMethodInterface {
    success?: boolean;
    paymentMethodData?: PaymentMethodDataInterface;
    paymentVerifyData?: PaymentVerifyInterface;
    loading?: boolean
}

export interface PaymentMethodDataInterface {
    name: string,
    slug: string,
    image: string,
    status: boolean
}


export interface PaymentVerifyInterface {
    item_id: number,
    type:string,
    transaction_id?:string
}