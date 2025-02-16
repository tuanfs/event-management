interface ITicket {
    type: string;
    price: number;
    limit: number;
    available: number;
}

export interface IEvent {
    name: string;
    description: string;
    date: Date;
    location: string;
    tickets: ITicket[];
}
