insert into public.creative_assets (
  user_id,
  folder_id,
  drive_file_id,
  file_name,
  file_type,
  drive_url,
  preview_url,
  origin_folder,
  category,
  country,
  niche,
  status,
  notes
)
select
  folder.user_id,
  folder.id,
  'seed-' || coalesce(folder.drive_folder_id, folder.id::text) || '-' || asset.index,
  folder.name || ' - Exemplo ' || asset.index,
  asset.file_type,
  folder.drive_url,
  folder.drive_url,
  lower(replace(folder.folder_type, ' ', '_')),
  asset.category,
  'Chile',
  'iGaming',
  'active',
  'Asset exemplo cadastrado manualmente a partir da pasta Drive existente.'
from public.creative_folders folder
cross join (
  values
    (1, 'image/png', 'Imagem estatica'),
    (2, 'image/png', 'Story/Reels'),
    (3, 'video/mp4', 'Video curto')
) as asset(index, file_type, category)
where folder.user_id = auth.uid()
on conflict (user_id, drive_file_id) do update set
  folder_id = excluded.folder_id,
  file_name = excluded.file_name,
  file_type = excluded.file_type,
  drive_url = excluded.drive_url,
  preview_url = excluded.preview_url,
  origin_folder = excluded.origin_folder,
  category = excluded.category,
  country = excluded.country,
  niche = excluded.niche,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now();
