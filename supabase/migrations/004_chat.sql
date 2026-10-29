create table public.direct_messages(id uuid primary key default gen_random_uuid(),sender_id uuid not null references public.profiles on delete cascade,recipient_id uuid not null references public.profiles on delete cascade,body text not null check(length(trim(body)) between 1 and 2000),created_at timestamptz not null default now(),read_at timestamptz,check(sender_id<>recipient_id));
create index dm_sender on public.direct_messages(sender_id,created_at desc);
create index dm_recipient on public.direct_messages(recipient_id,created_at desc);
alter table public.direct_messages enable row level security;
revoke all on public.direct_messages from anon,authenticated;
grant select on public.direct_messages to authenticated;
create policy dm_participants on public.direct_messages for select to authenticated using((sender_id=auth.uid() or recipient_id=auth.uid()) and not public.is_blocked(case when sender_id=auth.uid() then recipient_id else sender_id end));
create function public.send_direct_message(recipient uuid,message_body text,message_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();begin
 if uid is null or uid=recipient or public.is_blocked(recipient) then raise exception 'invalid recipient';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,1));
 if exists(select 1 from public.direct_messages where id=message_id and sender_id=uid and recipient_id=recipient and body=trim(message_body)) then return;end if;
 if (select count(*) from public.direct_messages where sender_id=uid and created_at>now()-interval '1 minute')>=30 then raise exception 'rate limited';end if;
 insert into public.direct_messages(id,sender_id,recipient_id,body) values(message_id,uid,recipient,trim(message_body));
end $$;
create function public.read_direct_messages(peer uuid) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null or public.is_blocked(peer) then raise exception 'unauthorized';end if;
 update public.direct_messages set read_at=now() where recipient_id=auth.uid() and sender_id=peer and read_at is null;
end $$;
revoke all on function public.send_direct_message(uuid,text,uuid),public.read_direct_messages(uuid) from public,anon;
grant execute on function public.send_direct_message(uuid,text,uuid),public.read_direct_messages(uuid) to authenticated;
