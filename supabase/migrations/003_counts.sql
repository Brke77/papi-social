-- Counts come from complete authorized rows, never from truncated UI lists.
create function public.papi_counts(post_ids uuid[],profile_ids uuid[]) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if cardinality(post_ids)>100 or cardinality(profile_ids)>2500 then raise exception 'request too large';end if;
 return jsonb_build_object(
 'posts',coalesce((select jsonb_object_agg(p.id,jsonb_build_object('likeCount',(select count(*) from public.post_likes l where l."targetId"=p.id),'commentCount',(select count(*) from public.comments c where c."postId"=p.id))) from public.posts p where p.id=any(post_ids)),'{}'::jsonb),
 'profiles',coalesce((select jsonb_object_agg(p.id,jsonb_build_object('postCount',(select count(*) from public.posts s where s."authorId"=p.id),'followerCount',(select count(*) from public.follows f where f."targetId"=p.id),'followingCount',(select count(*) from public.follows f where f."userId"=p.id))) from public.profiles p where p.id=any(profile_ids)),'{}'::jsonb));
end $$;
revoke all on function public.papi_counts(uuid[],uuid[]) from public;
grant execute on function public.papi_counts(uuid[],uuid[]) to anon,authenticated;
