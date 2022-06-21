import {
  MessageActionRow,
  MessageActionRowComponent,
  MessageActionRowComponentResolvable,
  MessageButton,
} from 'discord.js';
import { truncate } from 'src/utils/string';

type Columns = 2 | 3 | 4 | 5;

interface LabelledItem<Value = any> {
  label: string;
  value: Value;
}

interface BaseListOptions<Item, Value = any> {
  items: Item[];
  getLabel: (item: Item) => string;
  getValue: (item: Item) => Value;
  size?: Columns;
}

type LabelledListOptions<Item, Value = any> = Omit<BaseListOptions<Item, Value>, keyof LabelledItem> & {
  [Property in keyof Pick<BaseListOptions<Item, Value>, `get${Capitalize<keyof LabelledItem>}`>]+?: BaseListOptions<
    Item,
    Value
  >[Property];
};

export type PaginatedButtonListOptions<Item, Value = any> = Item extends LabelledItem
  ? LabelledListOptions<Item, Value>
  : BaseListOptions<Item, Value>;

export class PaginatedButtonList<Item, Value> {
  private readonly items: Item[];
  private readonly getLabel: (item: Item) => string;
  private readonly getValue: (item: Item) => Value;

  constructor({ items, getLabel, getValue }: PaginatedButtonListOptions<Item, Value>) {
    this.items = items;

    const isLabelled = items.every(
      (item: Record<string, any>) => typeof item.label === 'string' && typeof item.value !== 'undefined',
    );

    this.getLabel = isLabelled ? (item: Item) => (item as unknown as { label: string }).label : getLabel;
    this.getValue = isLabelled ? (item: Item) => (item as unknown as { value: Value }).value : getValue;
  }

  public buildButtons(
    page?: number,
  ): MessageActionRow<MessageActionRowComponent, MessageActionRowComponentResolvable, any>[] {
    return this.items.map(
      (item, index) =>
        new MessageActionRow({
          components: [
            new MessageButton({
              customId: `${index}`,
              label: truncate(this.getLabel(item), 80),
              style: 'PRIMARY',
            }),
          ],
        }),
    );
  }
}
