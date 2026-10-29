-- PAPI v1. Apply once to an empty Supabase project. UTC timestamps, private by default.
create extension if not exists pgcrypto;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 username text not null unique check(username ~ '^[a-z0-9_]{3,24}$'),
 name text not null check(length(name) between 2 and 60), bio text not null default '' check(length(bio)<=240),
 location text not null default '' check(length(location)<=80), website text not null default '' check(website='' or website ~ '^https?://'),
 avatar text not null default '', cover text not null default '', role text not null default 'member' check(role in ('member','moderator')),
 "createdAt" timestamptz not null default now()
);
create unique index profiles_username_lower on public.profiles(lower(username));
create table public.posts (
 id uuid primary key default gen_random_uuid(), "authorId" uuid not null references public.profiles on delete cascade,
 caption text not null check(length(caption)<=2000),category text not null check(category in ('Streetwear','Sneakers','Otomobil','Saat & Aksesuar','Setup','Teknoloji','Seyahat','Fotoğraf','Koleksiyon','Fitness','Sanat','Başarılar','Lifestyle','Diğer')),
 media text[] not null default '{}',tags text[] not null default '{}',hidden boolean not null default false,"createdAt" timestamptz not null default now(),
 check(cardinality(media)<=4),check(cardinality(tags)<=10),check(length(trim(caption))>=3 or cardinality(media)>0)
);
create index posts_feed on public.posts("createdAt" desc) where not hidden;
create index posts_author on public.posts("authorId","createdAt" desc);
create table public.comments(id uuid primary key default gen_random_uuid(),"postId" uuid not null references public.posts on delete cascade,"authorId" uuid not null references public.profiles on delete cascade,text text not null check(length(trim(text)) between 1 and 500),"createdAt" timestamptz not null default now());
create index comments_post on public.comments("postId","createdAt");
create table public.post_likes("userId" uuid references public.profiles on delete cascade,"targetId" uuid references public.posts on delete cascade,primary key("userId","targetId"));
create index likes_target on public.post_likes("targetId");
create table public.bookmarks("userId" uuid references public.profiles on delete cascade,"targetId" uuid references public.posts on delete cascade,primary key("userId","targetId"));
create table public.follows("userId" uuid references public.profiles on delete cascade,"targetId" uuid references public.profiles on delete cascade,primary key("userId","targetId"),check("userId"<>"targetId"));
create index follows_target on public.follows("targetId");
create table public.blocks("userId" uuid references public.profiles on delete cascade,"targetId" uuid references public.profiles on delete cascade,primary key("userId","targetId"),check("userId"<>"targetId"));
create index blocks_target on public.blocks("targetId");
create table public.notifications(id uuid primary key default gen_random_uuid(),"recipientId" uuid not null references public.profiles on delete cascade,"actorId" uuid not null references public.profiles on delete cascade,type text not null check(type in ('like','comment','follow')),"targetId" uuid not null,read boolean not null default false,"createdAt" timestamptz not null default now());
create index notifications_recipient on public.notifications("recipientId","createdAt" desc);
create table public.reports(id uuid primary key default gen_random_uuid(),"userId" uuid not null references public.profiles on delete cascade,"targetId" uuid not null,kind text not null check(kind in ('post','profile')),reason text not null check(reason in ('Spam','Taciz','Nefret söylemi','Taklit hesap','Uygunsuz içerik','Diğer')),status text not null default 'open' check(status in ('open','resolved')),"createdAt" timestamptz not null default now());
create unique index reports_once on public.reports("userId","targetId",kind) where status='open';
create table public.user_settings("userId" uuid primary key references public.profiles on delete cascade,theme text not null default 'dark' check(theme in ('dark','light')),notifications boolean not null default true);
create table public.moderation_actions(id uuid primary key default gen_random_uuid(),moderator_id uuid not null references public.profiles,report_id uuid not null references public.reports,action text not null,created_at timestamptz not null default now());
create table public.action_limits(user_id uuid primary key references public.profiles on delete cascade,window_start timestamptz not null default now(),requests integer not null default 0);
-- Media and hashtags are bounded arrays on posts in v1: one atomic post write, no N+1 media queries.
-- No roles or ownership values are ever accepted from user metadata.
create function public.on_signup() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,username,name) values(new.id,lower(new.raw_user_meta_data->>'username'),new.raw_user_meta_data->>'display_name');
 insert into public.user_settings("userId") values(new.id);return new;
end $$;
create trigger papi_signup after insert on auth.users for each row execute function public.on_signup();
create function public.is_moderator() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='moderator') $$;
create function public.is_blocked(other uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.blocks where ("userId"=auth.uid() and "targetId"=other) or ("targetId"=auth.uid() and "userId"=other)) $$;
create function public.can_read_post(pid uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.posts where id=pid and (public.is_moderator() or (not hidden and not public.is_blocked("authorId"))))$$;
do $$ declare t text; begin foreach t in array array['profiles','posts','comments','post_likes','bookmarks','follows','blocks','notifications','reports','user_settings','moderation_actions','action_limits'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon, authenticated',t);execute format('grant select on public.%I to anon, authenticated',t);end loop;end $$;
create policy profiles_read on public.profiles for select using(not public.is_blocked(id) or id=auth.uid() or public.is_moderator());
create policy posts_read on public.posts for select using(public.can_read_post(id));
create policy comments_read on public.comments for select using(public.can_read_post("postId") and not public.is_blocked("authorId"));
create policy likes_read on public.post_likes for select using(public.can_read_post("targetId"));
create policy follows_read on public.follows for select using(not public.is_blocked("userId") and not public.is_blocked("targetId"));
create policy bookmarks_read on public.bookmarks for select using("userId"=auth.uid());
create policy blocks_read on public.blocks for select using("userId"=auth.uid());
create policy notifications_read on public.notifications for select using("recipientId"=auth.uid());
create policy reports_read on public.reports for select using("userId"=auth.uid() or public.is_moderator());
create policy settings_read on public.user_settings for select using("userId"=auth.uid());
create policy moderation_read on public.moderation_actions for select using(public.is_moderator());
-- No direct INSERT/UPDATE/DELETE policies or grants. All mutations go through the validated RPC below.
create function public.papi_action(a jsonb) returns void language plpgsql security definer set search_path='' as $$
declare
 uid uuid:=auth.uid(); typ text:=a->>'type'; target uuid; owner_id uuid; p jsonb; r public.reports; n integer; removed integer; k text;
begin
 if uid is null or not exists(select 1 from public.profiles where id=uid) then raise exception 'authentication required';end if;
 -- Serialize per actor. Toggles and rate counts remain atomic under concurrent requests.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,0));
 insert into public.action_limits(user_id,window_start,requests) values(uid,now(),1) on conflict(user_id) do update set requests=case when action_limits.window_start<now()-interval '1 minute' then 1 else action_limits.requests+1 end,window_start=case when action_limits.window_start<now()-interval '1 minute' then now() else action_limits.window_start end returning requests into n;
 if n>60 then raise exception 'rate limited';end if;
 if typ in ('like','bookmark','follow','block','deletePost','deleteComment','moderate') then target:=(a->>'id')::uuid;end if;
 if typ in ('like','bookmark','deletePost') then
  select "authorId" into owner_id from public.posts where id=target and not hidden and not public.is_blocked("authorId");if owner_id is null then raise exception 'post unavailable';end if;
 end if;
 case typ
 when 'post' then
  p:=a->'post';target:=(p->>'id')::uuid;
  if (p->>'authorId')::uuid<>uid then raise exception 'wrong owner';end if;
  if exists(select 1 from public.posts where id=target and ("authorId"<>uid or hidden)) then raise exception 'wrong owner';end if;
  if jsonb_array_length(p->'media')>4 or jsonb_array_length(p->'tags')>10 then raise exception 'too many items';end if;
  for k in select jsonb_array_elements_text(p->'media') loop
   if k !~ ('^/api/media\?path='||uid::text||'%2F[a-f0-9-]+\.(jpg|png|webp)$') then raise exception 'invalid media owner';end if;
  end loop;
  for k in select jsonb_array_elements_text(p->'tags') loop if length(k)>40 then raise exception 'tag too long';end if;end loop;
  insert into public.posts(id,"authorId",caption,category,media,tags) values(target,uid,trim(p->>'caption'),p->>'category',array(select jsonb_array_elements_text(p->'media')),array(select jsonb_array_elements_text(p->'tags'))) on conflict(id) do update set caption=excluded.caption,category=excluded.category,media=excluded.media,tags=excluded.tags;
 when 'deletePost' then
  if owner_id<>uid then raise exception 'wrong owner';end if;delete from public.notifications where "targetId"=target and type in ('like','comment');delete from public.posts where id=target;
 when 'like' then
  delete from public.post_likes where "userId"=uid and "targetId"=target;get diagnostics removed=row_count;
  if removed=0 then insert into public.post_likes values(uid,target);if owner_id<>uid and coalesce((select notifications from public.user_settings where "userId"=owner_id),true) then insert into public.notifications("recipientId","actorId",type,"targetId") values(owner_id,uid,'like',target);end if;end if;
 when 'bookmark' then
  delete from public.bookmarks where "userId"=uid and "targetId"=target;get diagnostics removed=row_count;if removed=0 then insert into public.bookmarks values(uid,target);end if;
 when 'follow' then
  if target=uid or public.is_blocked(target) then raise exception 'invalid relationship';end if;
  delete from public.follows where "userId"=uid and "targetId"=target;get diagnostics removed=row_count;if removed=0 then insert into public.follows values(uid,target);if coalesce((select notifications from public.user_settings where "userId"=target),true) then insert into public.notifications("recipientId","actorId",type,"targetId") values(target,uid,'follow',uid);end if;end if;
 when 'block' then
  if target=uid then raise exception 'invalid relationship';end if;
  delete from public.blocks where "userId"=uid and "targetId"=target;get diagnostics removed=row_count;if removed=0 then insert into public.blocks values(uid,target);delete from public.follows where ("userId"=uid and "targetId"=target) or ("userId"=target and "targetId"=uid);end if;
 when 'comment' then
  target:=(a->>'postId')::uuid;select "authorId" into owner_id from public.posts where id=target and not hidden and not public.is_blocked("authorId");if owner_id is null then raise exception 'post unavailable';end if;
  insert into public.comments("postId","authorId",text) values(target,uid,trim(a->>'text'));
  if owner_id<>uid and coalesce((select notifications from public.user_settings where "userId"=owner_id),true) then insert into public.notifications("recipientId","actorId",type,"targetId") values(owner_id,uid,'comment',target);end if;
 when 'deleteComment' then
  if not exists(select 1 from public.comments where id=target and "authorId"=uid) then raise exception 'wrong owner';end if;delete from public.comments where id=target;
 when 'profile' then
  p:=a->'profile';if (p->>'id')::uuid<>uid then raise exception 'wrong owner';end if;
  foreach k in array array[p->>'avatar',p->>'cover'] loop if k<>'' and k !~ ('^/api/media\?path='||uid::text||'%2F[a-f0-9-]+\.(jpg|png|webp)$') then raise exception 'invalid media';end if;end loop;
  update public.profiles set username=lower(p->>'username'),name=trim(p->>'name'),bio=p->>'bio',location=p->>'location',website=p->>'website',avatar=p->>'avatar',cover=p->>'cover' where id=uid;
 when 'report' then
  target:=(a->>'targetId')::uuid;
  if (a->>'kind'='post' and not public.can_read_post(target)) or (a->>'kind'='profile' and not exists(select 1 from public.profiles where id=target)) then raise exception 'target unavailable';end if;
  insert into public.reports("userId","targetId",kind,reason) values(uid,target,a->>'kind',a->>'reason');
 when 'read' then update public.notifications set read=true where "recipientId"=uid and (a->>'id' is null or id=(a->>'id')::uuid);
 when 'preferences' then insert into public.user_settings("userId",theme,notifications) values(uid,a->'preferences'->>'theme',(a->'preferences'->>'notifications')::boolean) on conflict("userId") do update set theme=excluded.theme,notifications=excluded.notifications;
 when 'moderate' then
  if not public.is_moderator() then raise exception 'moderator required';end if;
  select * into r from public.reports where id=target for update;if r.id is null then raise exception 'report missing';end if;
  if (a->>'hide')::boolean and r.kind='post' then update public.posts set hidden=true where id=r."targetId";end if;
  update public.reports set status='resolved' where id=target;insert into public.moderation_actions(moderator_id,report_id,action) values(uid,target,case when (a->>'hide')::boolean then 'hide' else 'resolve' end);
 else raise exception 'unknown action';end case;
end $$;
revoke all on function public.papi_action(jsonb) from public,anon;
grant execute on function public.papi_action(jsonb) to authenticated;
revoke all on function public.on_signup() from public,anon,authenticated;
-- Private storage. Application server validates magic bytes before privileged upload.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('media','media',false,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy media_read on storage.objects for select using(bucket_id='media' and (
 (storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.posts p where public.can_read_post(p.id) and ('/api/media?path='||replace(name,'/','%2F'))=any(p.media))
 or exists(select 1 from public.profiles p where not public.is_blocked(p.id) and ('/api/media?path='||replace(name,'/','%2F')) in (p.avatar,p.cover))
));
