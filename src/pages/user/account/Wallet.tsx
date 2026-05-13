import { useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  ExternalLink,
  History,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile } from '@/hooks/api/use-user';
import { useCreateTopupOrder } from '@/hooks/api/use-topup';
import { useWallet, useWalletSummary, useWalletTransactions } from '@/hooks/api/use-wallet';
import type { Transaction } from '@/domain';
import { formatVND } from '@/lib/utils';

const MINIMUM_TOPUP_AMOUNT = 10000;
const QUICK_TOPUP_AMOUNTS = [10000, 50000, 100000, 200000];
const TRANSACTIONS_PAGE_SIZE = 6;

interface BalanceCardProps {
  currentBalance: number;
  monthlyTopupAmount: number;
  monthlySuccessfulTransactions: number;
}

function BalanceCard({ currentBalance, monthlyTopupAmount, monthlySuccessfulTransactions }: BalanceCardProps) {
  return (
    <Card className="group relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[linear-gradient(145deg,hsl(224_71%_18%)_0%,hsl(214_78%_25%)_48%,hsl(196_79%_34%)_100%)] p-6 text-white shadow-[0_28px_90px_-36px_rgba(15,23,42,0.7)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_36px_110px_-42px_rgba(15,23,42,0.76)] animate-in fade-in slide-in-from-bottom-3">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%)]" />
      <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl transition-transform duration-700 group-hover:scale-110" />
      <div className="relative space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/65">Available balance</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight sm:text-[2.75rem]">{formatVND(currentBalance)}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-3 shadow-lg shadow-slate-950/20 backdrop-blur-md">
            <Wallet className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/14">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Top-ups this month</p>
            <p className="mt-3 text-2xl font-semibold">{formatVND(monthlyTopupAmount)}</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-all duration-300 hover:bg-white/14">
            <p className="text-xs uppercase tracking-[0.18em] text-white/65">Successful transactions</p>
            <p className="mt-3 text-2xl font-semibold">{monthlySuccessfulTransactions}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-3xl border border-white/15 bg-slate-950/15 p-4 text-sm text-white/85 backdrop-blur-md">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-sky-100" />
          <div>
            <p className="font-medium text-white">Built for secure course payments</p>
            <p className="mt-1 text-white/70">
              Add funds once, manage study purchases faster, and keep every wallet action visible in one place.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface WalletHeroProps {
  currentBalance: number;
}

function WalletHero({ currentBalance }: WalletHeroProps) {
  return (
    <section className="group relative overflow-hidden rounded-[36px] border border-slate-200/70 bg-[linear-gradient(135deg,hsl(0_0%_100%)_0%,hsl(210_40%_98%)_38%,hsl(201_100%_97%)_100%)] px-6 py-8 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.4)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_36px_100px_-48px_rgba(15,23,42,0.45)] sm:px-8 lg:px-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.12),transparent_30%)]" />
      <div className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />
      <div className="relative grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-end">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Premium wallet workspace
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Keep payments effortless while staying in control of every balance update.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Move from browsing courses to checkout faster with a cleaner wallet flow, clearer activity tracking, and a layout consistent with the rest of the platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <div className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:text-slate-900">
              Unified payment overview
            </div>
            <div className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:text-slate-900">
              Real-time transaction visibility
            </div>
            <div className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:text-slate-900">
              Faster checkout for course access
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-900/80 bg-slate-950 p-6 text-white shadow-[0_24px_80px_-36px_rgba(15,23,42,0.75)] transition-all duration-500 group-hover:-translate-y-1">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Wallet overview</p>
          <p className="mt-5 text-4xl font-semibold tracking-tight">{formatVND(currentBalance)}</p>
          <div className="mt-6 grid gap-3 text-sm text-slate-300">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Use case</span>
              <span className="font-medium text-white">Course checkout</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Gateway</span>
              <span className="font-medium text-white">VNPay</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span>Minimum top-up</span>
              <span className="font-medium text-white">{formatVND(MINIMUM_TOPUP_AMOUNT)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface CreatePaymentCardProps {
  amount: string;
  isCreating: boolean;
  onAmountChange: (value: string) => void;
  onStartPayment: () => Promise<void>;
}

function CreatePaymentCard({ amount, isCreating, onAmountChange, onStartPayment }: CreatePaymentCardProps) {
  return (
    <Card className="group rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_26px_80px_-48px_rgba(15,23,42,0.38)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_36px_96px_-48px_rgba(15,23,42,0.42)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 transition-colors duration-300 group-hover:bg-slate-900 group-hover:text-white">
            <CreditCard className="h-4 w-4" />
            Funding details
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Add funds to your wallet</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Choose a quick amount or enter a custom value, then you'll be redirected to VNPay to complete the payment securely.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700 shadow-sm">
          <p className="font-medium text-slate-950">Quick start</p>
          <p className="mt-1 text-slate-600">Use a preset amount to move through the payment flow faster.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="amount">Top-up amount (VND)</Label>
            <Input
              id="amount"
              type="number"
              min={MINIMUM_TOPUP_AMOUNT}
              step={1000}
              placeholder="Example: 50000"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
              disabled={isCreating}
              className="h-14 rounded-2xl border-slate-200 text-lg shadow-sm transition-all duration-300 focus-visible:ring-slate-900/20"
            />
            <p className="text-xs text-slate-500">Minimum amount: {formatVND(MINIMUM_TOPUP_AMOUNT)}.</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Quick amounts</p>
            <div className="flex flex-wrap gap-3">
              {QUICK_TOPUP_AMOUNTS.map((presetAmount) => {
                const isActive = Number(amount) === presetAmount;
                return (
                  <Button
                    key={presetAmount}
                    type="button"
                    variant={isActive ? 'default' : 'outline'}
                    className="h-11 min-w-[128px] rounded-full border-slate-200 transition-all duration-300 hover:-translate-y-0.5"
                    onClick={() => onAmountChange(String(presetAmount))}
                    disabled={isCreating}
                  >
                    {formatVND(presetAmount)}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.96))] p-5 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md">
          <p className="text-sm font-medium text-slate-700">Payment summary</p>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Amount</span>
              <span className="font-semibold text-slate-950">{formatVND(Number(amount) || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Method</span>
              <span className="font-medium text-slate-950">VNPay</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">Ready</span>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-sky-100 bg-sky-50/80 p-4 text-sm text-sky-950">
            <p className="font-medium">Secure redirect</p>
            <p className="mt-1 leading-6 text-sky-900/80">
              You'll be redirected to VNPay's secure payment page. After completing, you'll return here automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={onStartPayment}
          disabled={isCreating || Number(amount) < MINIMUM_TOPUP_AMOUNT}
          className="h-12 min-w-[220px] rounded-full bg-slate-950 px-6 text-white shadow-lg shadow-slate-950/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating order...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Pay with VNPay
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isDeposit = transaction.transactionType === 'DEPOSIT';
  const statusTone =
    transaction.status === 'SUCCESS'
      ? 'bg-emerald-100 text-emerald-700'
      : transaction.status === 'FAILED'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-amber-100 text-amber-700';

  return (
    <div className="group flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/90 px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md sm:flex-row sm:items-center sm:justify-between animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
            isDeposit ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isDeposit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
        </div>
        <div>
          <p className="font-medium text-slate-950">{transaction.description || (isDeposit ? 'Wallet top-up' : 'Course payment')}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{new Date(transaction.createdAt).toLocaleString('en-GB')}</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone}`}>
              {transaction.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <p className={`text-lg font-semibold ${isDeposit ? 'text-emerald-600' : 'text-slate-900'}`}>
          {isDeposit ? '+' : '-'}{formatVND(Number(transaction.amount) || 0)}
        </p>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {isDeposit ? 'Deposit' : 'Payment'}
        </span>
      </div>
    </div>
  );
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 px-5 py-4">
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-200" />
              <div className="space-y-3">
                <div className="h-4 w-48 rounded-full bg-slate-200" />
                <div className="h-3 w-36 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="space-y-3 sm:flex sm:flex-col sm:items-end sm:space-y-2">
              <div className="h-4 w-24 rounded-full bg-slate-200" />
              <div className="h-3 w-16 rounded-full bg-slate-200" />
            </div>
            <div className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.7)_48%,transparent_100%)] animate-[shimmer_1.6s_infinite]" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface RecentTransactionsCardProps {
  isLoading: boolean;
  transactions: Transaction[];
  activeFilter: 'ALL' | 'DEPOSIT' | 'PAYMENT';
  onFilterChange: (value: 'ALL' | 'DEPOSIT' | 'PAYMENT') => void;
  onLoadMore: () => void;
  canLoadMore: boolean;
}

function RecentTransactionsCard({
  isLoading,
  transactions,
  activeFilter,
  onFilterChange,
  onLoadMore,
  canLoadMore,
}: RecentTransactionsCardProps) {
  return (
    <Card className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_26px_80px_-48px_rgba(15,23,42,0.28)] backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            <History className="h-4 w-4" />
            Recent activity
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Transaction history</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review deposits and payments in one place with cleaner filtering and quick scanning.
          </p>
        </div>

        <Tabs value={activeFilter} onValueChange={(value) => onFilterChange(value as 'ALL' | 'DEPOSIT' | 'PAYMENT')}>
          <TabsList className="h-auto rounded-full border border-slate-200 bg-slate-100/90 p-1">
            <TabsTrigger value="ALL" className="rounded-full px-4 py-2 data-[state=active]:bg-white">All</TabsTrigger>
            <TabsTrigger value="DEPOSIT" className="rounded-full px-4 py-2 data-[state=active]:bg-white">Deposit</TabsTrigger>
            <TabsTrigger value="PAYMENT" className="rounded-full px-4 py-2 data-[state=active]:bg-white">Payment</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-8 space-y-3">
        {isLoading ? (
          <TransactionsSkeleton />
        ) : transactions.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500">
            No transactions match this filter yet.
          </div>
        ) : (
          transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)
        )}
      </div>

      {!isLoading && canLoadMore && transactions.length > 0 ? (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={onLoadMore}
            className="h-12 rounded-full border-slate-200 px-5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
          >
            View more
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function LoginRequiredCard() {
  return (
    <Card className="rounded-[28px] border border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,247,237,0.95))] p-6 shadow-[0_24px_60px_-42px_rgba(180,83,9,0.35)]">
      <div className="flex items-start gap-4 text-amber-950">
        <div className="rounded-2xl bg-amber-100 p-3">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in to access your wallet</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-amber-900/80">
            Your wallet dashboard requires an active session to load balance details, transaction history, and payment requests.
            Please sign in, then return here to continue.
          </p>
          <Button type="button" onClick={() => (window.location.href = '/login')} className="mt-6 h-12 rounded-full px-6">
            Go to sign in
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function WalletPage() {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const { user, isLoading: isLoadingProfile } = useProfile();
  const { data: wallet, isLoading: isLoadingWallet } = useWallet();
  const { data: walletSummary, isLoading: isLoadingSummary } = useWalletSummary();
  const [transactionLimit, setTransactionLimit] = useState(TRANSACTIONS_PAGE_SIZE);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'DEPOSIT' | 'PAYMENT'>('ALL');
  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useWalletTransactions({
    page: 1,
    limit: transactionLimit,
  });
  const createOrderMutation = useCreateTopupOrder();
  const [amount, setAmount] = useState(String(QUICK_TOPUP_AMOUNTS[1]));

  const currentBalance = Number(wallet?.balance ?? user?.wallet?.allowance) || 0;
  const monthlyTopupAmount = Number(walletSummary?.monthlyTopupAmount ?? 0);
  const monthlySuccessfulTransactions = Number(walletSummary?.monthlySuccessfulTransactions ?? 0);
  const allTransactions = transactionsResponse?.data ?? [];
  const pagination = transactionsResponse?.pagination;
  const filteredTransactions = allTransactions.filter((transaction) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'DEPOSIT') return transaction.transactionType === 'DEPOSIT';
    return transaction.transactionType !== 'DEPOSIT';
  });
  const canLoadMore = (pagination?.total ?? 0) > transactionLimit;

  const handleCreateOrder = async () => {
    if (createOrderMutation.isPending) return;
    const realMoney = Number(amount);

    if (!accessToken) {
      toast.error('Please sign in before starting a payment.');
      return;
    }

    if (Number.isNaN(realMoney) || realMoney < MINIMUM_TOPUP_AMOUNT) {
      toast.error(`Please enter a valid amount of at least ${formatVND(MINIMUM_TOPUP_AMOUNT)}.`);
      return;
    }

    try {
      const response = await createOrderMutation.mutateAsync({ realMoney });
      const data = response.data;

      if (!data?.paymentUrl) {
        throw new Error('Missing payment URL from the server response.');
      }

      toast.success('Redirecting to VNPay...');
      window.location.href = data.paymentUrl;
    } catch (error) {
      const apiMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message ||
            (error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.error
          : undefined;
      const message = error instanceof Error ? apiMessage || error.message : apiMessage || 'Unable to create payment order.';
      toast.error(message);
    }
  };

  const handleLoadMoreTransactions = () => {
    setTransactionLimit((currentLimit) => currentLimit + TRANSACTIONS_PAGE_SIZE);
  };

  if (!accessToken) {
    return (
      <div className="space-y-6 pb-10">
        <main className="space-y-6">
          <WalletHero currentBalance={0} />
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <BalanceCard currentBalance={0} monthlyTopupAmount={0} monthlySuccessfulTransactions={0} />
            <LoginRequiredCard />
          </div>
        </main>
      </div>
    );
  }

  if (isLoadingProfile || isLoadingWallet || isLoadingSummary) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 [@keyframes_shimmer]{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}">
      <main className="space-y-6">
        <WalletHero currentBalance={currentBalance} />

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <BalanceCard
            currentBalance={currentBalance}
            monthlyTopupAmount={monthlyTopupAmount}
            monthlySuccessfulTransactions={monthlySuccessfulTransactions}
          />
          <CreatePaymentCard
            amount={amount}
            isCreating={createOrderMutation.isPending}
            onAmountChange={setAmount}
            onStartPayment={handleCreateOrder}
          />
        </div>

        <RecentTransactionsCard
          isLoading={isLoadingTransactions}
          transactions={filteredTransactions}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onLoadMore={handleLoadMoreTransactions}
          canLoadMore={canLoadMore}
        />
      </main>
    </div>
  );
}
