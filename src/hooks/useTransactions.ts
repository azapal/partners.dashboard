import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { transactionService, type TransactionsQuery } from '../service/partnerService';

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (query: TransactionsQuery) => [...transactionKeys.all, 'list', query] as const,
};

export const useGetTransactions = (query: TransactionsQuery = {}) =>
  useQuery({
    queryKey: transactionKeys.list(query),
    queryFn: () => transactionService.getAll(query),
    placeholderData: keepPreviousData,
  });
