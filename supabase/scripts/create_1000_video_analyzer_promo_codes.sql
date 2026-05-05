drop table if exists pg_temp.generated_video_analyzer_promo_codes;

create temporary table generated_video_analyzer_promo_codes (
  code text primary key
);

do $$
declare
  v_alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_target_count constant integer := 1000;
  v_created_count integer := 0;
  v_inserted_count integer;
  v_code text;
begin
  while v_created_count < v_target_count loop
    select string_agg(
      substr(
        v_alphabet,
        floor(random() * length(v_alphabet))::integer + 1,
        1
      ),
      ''
    )
    into v_code
    from generate_series(1, 16);

    insert into public.video_analyzer_promo_codes (code)
    values (v_code)
    on conflict do nothing;

    get diagnostics v_inserted_count = row_count;

    if v_inserted_count = 1 then
      insert into generated_video_analyzer_promo_codes (code)
      values (v_code);

      v_created_count := v_created_count + 1;
    end if;
  end loop;
end;
$$;

select
  count(*) as created_codes
from generated_video_analyzer_promo_codes;

select
  code,
  substr(code, 1, 4)
    || '-'
    || substr(code, 5, 4)
    || '-'
    || substr(code, 9, 4)
    || '-'
    || substr(code, 13, 4) as formatted_code
from generated_video_analyzer_promo_codes
order by code;
