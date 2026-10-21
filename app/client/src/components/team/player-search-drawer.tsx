import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import type { TeamLabSearchTarget } from '@/components/team/team-lab-ui-types';
import type { PlayerSeason } from '@draft-duck/core';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useMobileDrawerViewport } from '@/components/team/use-mobile-drawer-viewport';

/** Search the fixed historical player catalog and prevent any selected identity from being added twice. */
export function PlayerSearchDrawer({
    open,
    target,
    isDesktop,
    players,
    loading,
    error,
    selectedIds,
    onClose,
    onRetry,
    onSelect
}: {
    open: boolean;
    target: TeamLabSearchTarget;
    isDesktop: boolean;
    players: PlayerSeason[];
    loading: boolean;
    error: boolean;
    selectedIds: Set<string>;
    onClose: () => void;
    onRetry: () => void;
    onSelect: (player: PlayerSeason) => void;
}) {
    const [query, setQuery] = useState('');
    const viewport = useMobileDrawerViewport(open && !isDesktop);
    const filtered = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase();
        const available = players.filter((player) => !selectedIds.has(player.playerId));
        const result = normalized
            ? available.filter((player) =>
                  `${player.name} ${player.team} ${player.pos}`.toLocaleLowerCase().includes(normalized)
              )
            : available;
        return result.slice(0, 40);
    }, [players, query, selectedIds]);

    useEffect(() => {
        if (open) {
            setQuery('');
        }
    }, [open, target?.rowId, target?.side]);

    return (
        <Drawer
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    onClose();
                }
            }}
            direction={isDesktop ? 'right' : 'bottom'}
            repositionInputs={isDesktop}
        >
            <DrawerContent
                aria-labelledby='team-player-search-title'
                aria-describedby='team-player-search-description'
                className={isDesktop ? undefined : 'overflow-y-auto'}
                style={
                    !isDesktop && viewport
                        ? {
                              top: `calc(10svh + ${viewport.offsetTop}px)`,
                              bottom: 'auto',
                              marginTop: 0,
                              height: `calc(${viewport.height}px - 10svh)`,
                              maxHeight: `calc(${viewport.height}px - 10svh)`
                          }
                        : undefined
                }
            >
                <div className='grid shrink-0 gap-2 border-b border-border px-5 py-4'>
                    <DrawerTitle id='team-player-search-title'>
                        {target?.side === 'team' ? 'Add teammate' : 'Find candidate'}
                    </DrawerTitle>
                    <DrawerDescription id='team-player-search-description'>
                        Search the historical CSV player pool with at least 20 games by name, team, or position.
                    </DrawerDescription>
                    <div className='relative'>
                        <Search aria-hidden='true' className='absolute top-3.5 left-3 size-4 text-muted-foreground' />
                        <Input
                            autoFocus
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder='Search players'
                            className='pl-9'
                            aria-label='Search players'
                        />
                    </div>
                </div>
                <div className='min-h-0 flex-1 overflow-y-auto px-5 py-3'>
                    {loading ? (
                        <p role='status' className='text-sm text-muted-foreground'>
                            Loading players…
                        </p>
                    ) : null}
                    {error ? (
                        <div className='grid justify-items-start gap-3'>
                            <p role='alert' className='mb-0 text-sm text-destructive'>
                                Could not load the player pool.
                            </p>
                            <Button type='button' variant='outline' onClick={onRetry}>
                                Retry
                            </Button>
                        </div>
                    ) : null}
                    {!loading && !error && filtered.length === 0 ? (
                        <p className='mb-0 text-sm text-muted-foreground'>No available players match “{query}”.</p>
                    ) : null}
                    <ul className='m-0 flex list-none flex-col gap-2 p-0'>
                        {!loading && !error
                            ? filtered.map((player) => (
                                  <li
                                      key={player.playerId}
                                      className='overflow-hidden rounded-lg border border-border bg-card'
                                  >
                                      <button
                                          type='button'
                                          className='flex min-h-16 w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-3 text-left text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'
                                          onClick={() => onSelect(player)}
                                      >
                                          <span className='min-w-0'>
                                              <span className='block truncate font-semibold text-foreground'>
                                                  {player.name}
                                              </span>
                                              <span className='block truncate text-xs text-muted-foreground'>
                                                  {player.team} · {player.pos}
                                              </span>
                                          </span>
                                          <Plus aria-hidden='true' className='size-4 shrink-0 text-primary' />
                                      </button>
                                  </li>
                              ))
                            : null}
                    </ul>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
