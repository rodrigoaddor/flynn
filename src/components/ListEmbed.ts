interface ListMessageOptions<T> {
  items: { label: string; value: T }[];
  limit: number;
}

export class ListMessage<T> {
  constructor(private readonly options: ListMessageOptions<T>) {}

  public async 
}
