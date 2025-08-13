import {MoneyBank} from 'workspace/domain/piggy-bank/model/MoneyBank'
import {RamBank} from 'workspace/domain/piggy-bank/model/RamBank'

export type Bank = {
    moneyBank: MoneyBank;
    ramBank: RamBank;
}